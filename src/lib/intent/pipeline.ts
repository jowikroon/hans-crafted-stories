/**
 * Shared intent pipeline: fastRoute → classifyIntent → execute / clarify / log
 *
 * Returns a typed PipelineOutcome so each surface (Portal, HansAI) can update
 * its own UI without any logic duplication.
 */
import { supabase } from "@/integrations/supabase/client";
import { fastRoute } from "@/lib/intent/router";
import { WORKFLOWS, type WorkflowDef } from "@/lib/config/workflows";

const INTENT_ROUTER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intent-router`;

// ── Types ──────────────────────────────────────────────────────────────────

export type PipelineOutcome =
  | { type: "workflow_match"; workflow: WorkflowDef; method: "fast" | "llm" }
  | { type: "clarify"; workflows: WorkflowDef[]; message?: string }
  | { type: "unhandled"; logged: true }
  | { type: "chat_fallback" };

export interface PipelineResult {
  outcome: PipelineOutcome;
  fastRouteScore: number;
}

interface LLMIntentResult {
  intent: string;
  confidence: number;
  missing_params: string[] | null;
  clarification: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function classifyIntent(input: string): Promise<LLMIntentResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const res = await fetch(INTENT_ROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ input }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("Intent classification failed:", e);
    return { intent: "unknown", confidence: 0, missing_params: null, clarification: null };
  }
}

export async function logUnhandledIntent(
  userInput: string,
  fastRouteScore: number,
  source: string = "command_center",
  llmIntent?: string,
  llmConfidence?: number,
): Promise<void> {
  try {
    await (supabase.from("unhandled_intents" as any) as any).insert({
      user_input: userInput,
      source,
      fast_route_score: fastRouteScore,
      llm_intent: llmIntent || null,
      llm_confidence: llmConfidence || null,
    });
  } catch (e) {
    console.error("Failed to log unhandled intent:", e);
  }
}

/**
 * Trigger an n8n workflow (or google-agent) by direct webhook POST.
 * Optional extraPayload is merged into the body (e.g. { message } for google-agent).
 */
export async function triggerWorkflow(
  wf: WorkflowDef,
  source: string = "command_center",
  extraPayload?: Record<string, unknown>,
): Promise<{ ok: boolean; data: unknown; error?: string }> {
  try {
    const body = { source, timestamp: new Date().toISOString(), ...extraPayload };
    const res = await fetch(wf.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, data: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── Main pipeline ──────────────────────────────────────────────────────────

/**
 * Run the full intent pipeline for a user input string.
 *
 * Steps:
 *   1. fastRoute  → direct match (confidence >= 0.85)
 *   2. fastRoute  → clarification alternatives (0.5 – 0.85)
 *   3. LLM classify → direct match (confidence >= 0.7)
 *   4. LLM classify → clarification
 *   5. LLM "unknown" → log as unhandled
 *   6. No match → chat_fallback
 *
 * The caller decides what to do with each outcome (execute, show alternatives,
 * display a message, fall back to AI chat).
 */
export async function runIntentPipeline(
  input: string,
  source: string = "command_center",
): Promise<PipelineResult> {
  const trimmed = input.trim();
  const route = fastRoute(trimmed);

  // 1. High-confidence direct match
  if (route.confidence >= 0.85 && route.workflow) {
    return {
      outcome: { type: "workflow_match", workflow: route.workflow, method: "fast" },
      fastRouteScore: route.confidence,
    };
  }

  // 2. Medium-confidence → offer alternatives
  if (route.confidence >= 0.5 && route.alternatives && route.alternatives.length > 0) {
    return {
      outcome: { type: "clarify", workflows: route.alternatives },
      fastRouteScore: route.confidence,
    };
  }

  // 3 & 4 & 5. Low confidence → ask the LLM
  const llmResult = await classifyIntent(trimmed);

  if (llmResult.intent !== "unknown" && llmResult.confidence >= 0.7) {
    const wf = WORKFLOWS.find((w) => w.name === llmResult.intent);
    if (wf) {
      return {
        outcome: { type: "workflow_match", workflow: wf, method: "llm" },
        fastRouteScore: route.confidence,
      };
    }
  }

  if (llmResult.clarification) {
    const matchingWfs = WORKFLOWS.filter(
      (w) => w.name === llmResult.intent || llmResult.confidence >= 0.3,
    ).slice(0, 10);

    if (matchingWfs.length > 0) {
      return {
        outcome: {
          type: "clarify",
          workflows: matchingWfs,
          message: llmResult.clarification,
        },
        fastRouteScore: route.confidence,
      };
    }
  }

  if (llmResult.intent === "unknown") {
    await logUnhandledIntent(trimmed, route.confidence, source, llmResult.intent, llmResult.confidence);
    return {
      outcome: { type: "unhandled", logged: true },
      fastRouteScore: route.confidence,
    };
  }

  // 6. Fallback: let the surface handle it as chat
  return {
    outcome: { type: "chat_fallback" },
    fastRouteScore: route.confidence,
  };
}
