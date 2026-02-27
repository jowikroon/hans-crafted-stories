import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { fastRoute, getWorkflowByName, WORKFLOWS } from "../_shared/workflows.ts";
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
    const sb = getSupabase();
    await sb.from("empire_events").insert({
      event_type: eventType,
      source,
      message,
      metadata,
      monday_item_id: mondayItemId || null,
    });
  } catch (e) {
    console.error("Failed to log empire event:", e);
  }
}

async function logUnhandledIntent(
  userInput: string,
  fastRouteScore: number,
  llmIntent?: string,
  llmConfidence?: number,
) {
  try {
    const sb = getSupabase();
    await sb.from("unhandled_intents").insert({
      user_input: userInput,
      source: "monday",
      fast_route_score: fastRouteScore,
      llm_intent: llmIntent || null,
      llm_confidence: llmConfidence || null,
    });
  } catch (e) {
    console.error("Failed to log unhandled intent:", e);
  }
}

async function classifyWithLLM(input: string): Promise<{ intent: string; confidence: number }> {
  try {
    const apiKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const res = await fetch(INTENT_ROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input, context: "Monday.com item creation" }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("LLM classification failed:", e);
    return { intent: "unknown", confidence: 0 };
  }
}

async function dispatchToN8N(webhookUrl: string, payload: Record<string, unknown>): Promise<{ ok: boolean; data: unknown }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }
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

    // Monday.com challenge verification (sent during webhook setup)
    if (body.challenge) {
      return new Response(
        JSON.stringify({ challenge: body.challenge }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const event = body.event;
    if (!event) {
      return new Response(
        JSON.stringify({ ok: true, message: "No event payload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Deduplicate: Monday.com can send the same event multiple times
    const eventId = `${event.type}-${event.pulseId || event.itemId}-${event.triggerTime || ""}`;
    if (processedEvents.has(eventId)) {
      return new Response(
        JSON.stringify({ ok: true, message: "Duplicate event, skipped" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    processedEvents.add(eventId);
    // Prevent memory leak: cap the dedup set
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

    // Fetch item details from Monday.com
    let itemName = event.pulseName || event.itemName || "";
    let boardId = String(event.boardId || "");

    if (!itemName) {
      try {
        const details = await getItemDetails(itemId);
        if (details) {
          itemName = details.name;
          boardId = details.boardId;
        }
      } catch (e) {
        console.error("Failed to fetch item details:", e);
      }
    }

    if (!itemName) {
      await logEmpireEvent(
        "monday_webhook",
        "monday",
        `Received event for item ${itemId} but could not extract name`,
        { event, itemId },
        itemId,
      );
      return new Response(
        JSON.stringify({ ok: false, error: "Could not determine item name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Monday webhook: item "${itemName}" (${itemId})`);

    // Step 1: Fast route
    const route = fastRoute(itemName);

    let matchedWorkflow = route.workflow;
    let routeMethod = route.method;
    let routeConfidence = route.confidence;

    // Step 2: LLM fallback if fast route has low confidence
    if (routeConfidence < 0.5) {
      const llmResult = await classifyWithLLM(itemName);
      if (llmResult.intent !== "unknown" && llmResult.confidence >= 0.6) {
        matchedWorkflow = getWorkflowByName(llmResult.intent) || null;
        routeMethod = "llm";
        routeConfidence = llmResult.confidence;
      } else {
        // Unhandled: log and notify
        await logUnhandledIntent(itemName, route.confidence, llmResult.intent, llmResult.confidence);
        await logEmpireEvent(
          "monday_unhandled",
          "monday",
          `Unhandled Monday item: "${itemName}"`,
          { itemId, boardId, fastScore: route.confidence, llmIntent: llmResult.intent, llmConfidence: llmResult.confidence },
          itemId,
        );

        try {
          await addItemUpdate(
            itemId,
            `🤖 AI Router: I couldn't match this to a known workflow (confidence: ${(route.confidence * 100).toFixed(0)}%). This has been logged for review.`,
          );
        } catch { /* non-critical */ }

        return new Response(
          JSON.stringify({ ok: true, routed: false, reason: "unhandled", logged: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    if (!matchedWorkflow) {
      return new Response(
        JSON.stringify({ ok: true, routed: false, reason: "no_match" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 3: Dispatch to N8N
    const n8nPayload = {
      source: "monday-webhook",
      monday_item_id: itemId,
      monday_board_id: boardId,
      item_name: itemName,
      workflow: matchedWorkflow.name,
      route_method: routeMethod,
      route_confidence: routeConfidence,
      timestamp: new Date().toISOString(),
    };

    try {
      await addItemUpdate(
        itemId,
        `🤖 AI Router: Matched to **${matchedWorkflow.label}** (${(routeConfidence * 100).toFixed(0)}% confidence via ${routeMethod}). Dispatching now...`,
      );
    } catch { /* non-critical */ }

    const result = await dispatchToN8N(matchedWorkflow.webhook, n8nPayload);

    // Step 4: Log and update Monday item
    await logEmpireEvent(
      "monday_dispatched",
      "monday",
      `Dispatched "${itemName}" → ${matchedWorkflow.label}`,
      {
        itemId,
        boardId,
        workflow: matchedWorkflow.name,
        method: routeMethod,
        confidence: routeConfidence,
        n8nSuccess: result.ok,
      },
      itemId,
    );

    if (result.ok) {
      try {
        await addItemUpdate(
          itemId,
          `✅ **${matchedWorkflow.label}** completed successfully.`,
        );
      } catch { /* non-critical */ }
    } else {
      try {
        await addItemUpdate(
          itemId,
          `❌ **${matchedWorkflow.label}** failed: ${typeof result.data === "string" ? result.data : "Check N8N logs."}`,
        );
      } catch { /* non-critical */ }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        routed: true,
        workflow: matchedWorkflow.name,
        method: routeMethod,
        confidence: routeConfidence,
        n8nSuccess: result.ok,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("monday-webhook error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
