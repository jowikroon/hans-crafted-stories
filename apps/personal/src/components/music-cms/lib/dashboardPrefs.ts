// Dashboardvoorkeuren, hard opgeslagen bij het account (niet in localStorage).
// Eén rij per gebruiker per dashboard in public.user_dashboard_prefs.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;
const TABLE = "user_dashboard_prefs";

export type SortDir = "asc" | "desc";

export interface DashboardPrefs {
  /** kolom-id's die zichtbaar zijn, in volgorde */
  columns: string[];
  sortBy: string;
  sortDir: SortDir;
  /** actieve toptab */
  filter: string;
}

export const DEFAULT_PREFS: DashboardPrefs = {
  columns: ["duration", "bpm", "key", "size", "date"],
  sortBy: "date",
  sortDir: "desc",
  filter: "alle",
};

export async function loadPrefs(dashboard: string): Promise<DashboardPrefs> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return DEFAULT_PREFS;
  const { data, error } = await db
    .from(TABLE)
    .select("prefs")
    .eq("user_id", uid)
    .eq("dashboard", dashboard)
    .maybeSingle();
  if (error || !data) return DEFAULT_PREFS;
  const p = (data as { prefs?: Partial<DashboardPrefs> }).prefs ?? {};
  return {
    columns: Array.isArray(p.columns) && p.columns.length ? p.columns : DEFAULT_PREFS.columns,
    sortBy: typeof p.sortBy === "string" ? p.sortBy : DEFAULT_PREFS.sortBy,
    sortDir: p.sortDir === "asc" || p.sortDir === "desc" ? p.sortDir : DEFAULT_PREFS.sortDir,
    filter: typeof p.filter === "string" ? p.filter : DEFAULT_PREFS.filter,
  };
}

export async function savePrefs(dashboard: string, prefs: DashboardPrefs): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Niet ingelogd — voorkeuren kunnen niet worden opgeslagen");
  const { error } = await db
    .from(TABLE)
    .upsert({ user_id: uid, dashboard, prefs }, { onConflict: "user_id,dashboard" });
  if (error) throw new Error(error.message);
}
