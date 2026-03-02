/**
 * stream-log — reusable helper for writing sub-step progress rows to workflow_logs.
 *
 * Usage (in any edge function):
 *   import { streamLog } from "../_shared/stream-log.ts";
 *   await streamLog(runId, "ANALYZE", "Authenticating Gmail API...");
 *   await streamLog(runId, "ANALYZE", "Google stack ready ✅", "done");
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/**
 * Insert one sub-step log row.
 * @param runId  UUID of the parent workflow_runs row.
 * @param step   Pipeline stage label (e.g. "ANALYZE").
 * @param substep Human-readable sub-step description shown as a live bullet.
 * @param status  "running" (default), "done", or "error".
 */
export async function streamLog(
  runId: string,
  step: string,
  substep: string,
  status: "running" | "done" | "error" = "running",
): Promise<void> {
  try {
    const { error } = await supabase
      .from("workflow_logs")
      .insert({ workflow_run_id: runId, step, substep, status });
    if (error) {
      console.error("[stream-log] insert error:", error.message);
    }
  } catch (err) {
    console.error("[stream-log] unexpected error:", err);
  }
}
