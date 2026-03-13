/**
 * writeMemory — consistent samantha_memory writer.
 *
 * All entries share the same value envelope:
 *   { event: string, data: Record<string, unknown>, ts: ISO string }
 *
 * user_id is resolved from the active Supabase session so callers never
 * need to pass it (and the sentinel UUID is never written by this helper).
 *
 * Tasks and ideas keep their own legacy format (written by persistTask)
 * because the read path parses them directly as TaskRecord objects.
 */
import { supabase } from "@/integrations/supabase/client";

export type MemoryCategory =
  | "workflow"
  | "confirmation"
  | "intent"
  | "health"
  | "task"
  | "idea"
  | "audit";

export async function writeMemory(
  event: string,
  category: MemoryCategory,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    const slug = event.replace(/\./g, "_");
    await supabase.from("samantha_memory").insert({
      key: `${category}_${slug}_${Date.now()}`,
      value: JSON.stringify({ event, data, ts: new Date().toISOString() }),
      category,
      source: "samantha",
      user_id: userId ?? null,
    });
  } catch { /* memory writes must never throw */ }
}
