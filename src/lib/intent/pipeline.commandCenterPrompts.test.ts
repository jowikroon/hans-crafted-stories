/**
 * Command Center — verify 10 prompts through the intent pipeline.
 * Each prompt must complete without throwing and return a valid PipelineResult.
 * Prompts match UnifiedChatPanel suggestionPool + 2 from commandSuggestions.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runIntentPipeline, type PipelineResult } from "./pipeline";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
    },
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
    }),
  },
}));

const COMMAND_CENTER_10_PROMPTS = [
  "Fix my AutoSEO workflow — it stopped triggering",
  "Generate a new n8n workflow for Channable feed optimization",
  "Run a full health check on all services",
  "Analyze my Cloudflare Workers performance",
  "Build a Gmail → Slack alert workflow",
  "Optimize product titles for SEO across all markets",
  "Run a Core Web Vitals audit on the site",
  "Show GA4 traffic overview for this week",
  "List all active n8n workflows",
  "Check VPS disk usage and memory",
];

const VALID_OUTCOME_TYPES = ["workflow_match", "clarify", "unhandled", "chat_fallback"] as const;

describe("Command Center — 10 prompts pipeline verification", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = import.meta.env.VITE_SUPABASE_URL;

  beforeEach(() => {
    (import.meta as any).env = { ...import.meta.env, VITE_SUPABASE_URL: "https://test.supabase.co" };
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        const u = typeof url === "string" ? url : (url as URL).href;
        if (u.includes("intent-router") && init?.method === "POST") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                intent: "unknown",
                confidence: 0.2,
                missing_params: null,
                clarification: null,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
        }
        return originalFetch(url, init as any);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    (import.meta as any).env.VITE_SUPABASE_URL = originalEnv;
  });

  it.each(COMMAND_CENTER_10_PROMPTS)(
    "pipeline returns valid outcome for prompt: %s",
    async (prompt) => {
      let result: PipelineResult;
      try {
        result = await runIntentPipeline(prompt, "command_center");
      } catch (err) {
        throw new Error(`Pipeline threw for "${prompt}": ${err}`);
      }
      expect(result).toBeDefined();
      expect(result.outcome).toBeDefined();
      expect(VALID_OUTCOME_TYPES).toContain(result.outcome.type);
      expect(typeof result.fastRouteScore).toBe("number");
    }
  );

  it("all 10 prompts complete with valid outcomes", async () => {
    const results = await Promise.all(
      COMMAND_CENTER_10_PROMPTS.map((p) => runIntentPipeline(p, "command_center"))
    );
    expect(results).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      expect(
        VALID_OUTCOME_TYPES.includes(results[i].outcome.type as (typeof VALID_OUTCOME_TYPES)[number]),
        `Prompt ${i + 1}: ${COMMAND_CENTER_10_PROMPTS[i]} got outcome type "${results[i].outcome.type}"`
      ).toBe(true);
    }
  });
});
