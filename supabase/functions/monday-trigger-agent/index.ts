/**
 * Monday Trigger Agent — AI-first entrypoint for Monday.com webhooks.
 * Use this URL in Monday.com → Integrations → Webhooks.
 * Each trigger is classified by LLM and routed to the matching n8n workflow.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { getWorkflowByName, type WorkflowDef } from "../_shared/workflows.ts";
import { addItemUpdate, getItemDetails } from "../_shared/monday.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const INTENT_ROUTER_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/intent-router`;
const processedEvents = new Set<string>();

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function logEmpireEvent(
  eventType: string,
  source: string,
  message: string,
  metadata: Record<string, unknown>,
  mondayItemId?: string,
) {
  try {
    await getSupabase().from("empire_events").insert({
      event_type: eventType,
      source,
      message,
      metadata,
      monday_item_id: mondayItemId ?? null,
    });
  } catch (e) {
    console.error("Trigger agent: log empire event failed", e);
  }
}

async function logUnhandledIntent(
  userInput: string,
  fastRouteScore: number,
  llmIntent?: string,
  llmConfidence?: number,
) {
  try {
    await getSupabase().from("unhandled_intents").insert({
      user_input: userInput,
      source: "monday-trigger-agent",
      fast_route_score: fastRouteScore,
      llm_intent: llmIntent ?? null,
      llm_confidence: llmConfidence ?? null,
    });
  } catch (e) {
    console.error("Trigger agent: log unhandled intent failed", e);
  }
}

async function classifyWithLLM(
  input: string,
  context?: string,
): Promise<{ intent: string; confidence: number }> {
  try {
    const res = await fetch(INTENT_ROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        input,
        context: context ?? "Monday.com trigger: new item or update. Classify which automation workflow should run.",
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("Trigger agent: LLM classification failed", e);
    return { intent: "unknown", confidence: 0 };
  }
}

async function dispatchToN8N(
  webhookUrl: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; data: unknown }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { ok: res.ok, data };
  } catch (e) {
    return { ok: false, data: e instanceof Error ? e.message : "Dispatch failed" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    if (body.challenge) {
      return new Response(JSON.stringify({ challenge: body.challenge }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = body.event;
    if (!event) {
      return new Response(
        JSON.stringify({ ok: true, message: "No event payload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const eventId = `${event.type}-${event.pulseId || event.itemId}-${event.triggerTime || ""}`;
    if (processedEvents.has(eventId)) {
      return new Response(
        JSON.stringify({ ok: true, message: "Duplicate event, skipped" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    processedEvents.add(eventId);
    if (processedEvents.size > 500) {
      const first = processedEvents.values().next().value;
      if (first) processedEvents.delete(first);
    }

    const itemId = String(event.pulseId || event.itemId || "");
    if (!itemId) {
      return new Response(
        JSON.stringify({ ok: false, error: "No item ID in event" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let itemName = event.pulseName || event.itemName || "";
    let boardId = String(event.boardId ?? "");

    if (!itemName) {
      try {
        const details = await getItemDetails(itemId);
        if (details) {
          itemName = details.name;
          boardId = details.boardId;
        }
      } catch (e) {
        console.error("Trigger agent: getItemDetails failed", e);
      }
    }

    if (!itemName) {
      await logEmpireEvent(
        "monday_webhook",
        "monday-trigger-agent",
        `Trigger for item ${itemId} but could not get name`,
        { event, itemId },
        itemId,
      );
      return new Response(
        JSON.stringify({ ok: false, error: "Could not determine item name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Monday trigger agent: "${itemName}" (${itemId})`);

    const llmResult = await classifyWithLLM(
      itemName,
      "Monday.com trigger: item created or updated. Decide which single workflow (autoseo, product-titles, health-check, product-feed, campaign, scraper) best matches this item title, or unknown.",
    );

    const workflowName = llmResult.intent;
    const confidence = llmResult.confidence;
    const matchedWorkflow: WorkflowDef | undefined = workflowName && workflowName !== "unknown"
      ? getWorkflowByName(workflowName)
      : undefined;

    if (!matchedWorkflow || confidence < 0.6) {
      await logUnhandledIntent(itemName, 0, workflowName, confidence);
      await logEmpireEvent(
        "monday_unhandled",
        "monday-trigger-agent",
        `Unhandled trigger: "${itemName}"`,
        {
          itemId,
          boardId,
          llmIntent: workflowName,
          llmConfidence: confidence,
        },
        itemId,
      );
      try {
        await addItemUpdate(
          itemId,
          `🤖 Trigger Agent: No workflow matched (${(confidence * 100).toFixed(0)}%). Logged for review in Portal → Status → Monday.com To do.`,
        );
      } catch {
        /* non-critical */
      }
      return new Response(
        JSON.stringify({ ok: true, routed: false, reason: "unhandled", logged: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const n8nPayload = {
      source: "monday-trigger-agent",
      monday_item_id: itemId,
      monday_board_id: boardId,
      item_name: itemName,
      workflow: matchedWorkflow.name,
      route_method: "llm",
      route_confidence: confidence,
      timestamp: new Date().toISOString(),
    };

    try {
      await addItemUpdate(
        itemId,
        `🤖 Trigger Agent: Matched **${matchedWorkflow.label}** (${(confidence * 100).toFixed(0)}%). Dispatching...`,
      );
    } catch {
      /* non-critical */
    }

    const result = await dispatchToN8N(matchedWorkflow.webhook, n8nPayload);

    await logEmpireEvent(
      "monday_dispatched",
      "monday-trigger-agent",
      `Dispatched "${itemName}" → ${matchedWorkflow.label}`,
      {
        itemId,
        boardId,
        workflow: matchedWorkflow.name,
        method: "llm",
        confidence,
        n8nSuccess: result.ok,
      },
      itemId,
    );

    if (result.ok) {
      try {
        await addItemUpdate(itemId, `✅ **${matchedWorkflow.label}** completed.`);
      } catch {
        /* non-critical */
      }
    } else {
      try {
        await addItemUpdate(
          itemId,
          `❌ **${matchedWorkflow.label}** failed: ${typeof result.data === "string" ? result.data : "Check N8N logs."}`,
        );
      } catch {
        /* non-critical */
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        routed: true,
        workflow: matchedWorkflow.name,
        method: "llm",
        confidence,
        n8nSuccess: result.ok,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("monday-trigger-agent error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
