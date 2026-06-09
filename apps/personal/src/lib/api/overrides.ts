import { supabase } from "@/integrations/supabase/client";

// Tables (page_overrides, edit_change_requests) are not in the generated Database
// types yet, so we cast the client. Matches the casting style used elsewhere.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface OverrideStyle {
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  paddingTop?: string;
  paddingBottom?: string;
  marginTop?: string;
  marginBottom?: string;
  display?: string; // e.g. "none" to hide
  [key: string]: string | undefined;
}

export interface PageOverride {
  element_key: string;
  page_path?: string | null;
  selector?: string | null;
  label?: string | null;
  text_override?: string | null;
  style: OverrideStyle;
}

/** All overrides — fetched once on load for every visitor. */
export async function getOverrides(): Promise<PageOverride[]> {
  const { data, error } = await db
    .from("page_overrides")
    .select("element_key,page_path,selector,label,text_override,style");
  if (error) {
    console.warn("[overrides] fetch failed", error.message);
    return [];
  }
  return (data ?? []) as PageOverride[];
}

/** Upsert a single element's override (admin only — enforced by RLS). */
export async function saveOverride(o: PageOverride): Promise<void> {
  const { error } = await db
    .from("page_overrides")
    .upsert(
      {
        element_key: o.element_key,
        page_path: o.page_path ?? null,
        selector: o.selector ?? null,
        label: o.label ?? null,
        text_override: o.text_override ?? null,
        style: o.style ?? {},
        updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "element_key" }
    );
  if (error) throw error;
}

/** Remove an element's override entirely (revert to source). */
export async function deleteOverride(elementKey: string): Promise<void> {
  const { error } = await db.from("page_overrides").delete().eq("element_key", elementKey);
  if (error) throw error;
}

// ── Phase 2 — structural / code-level change requests ──────────────────

export interface ChangeRequest {
  id?: string;
  element_key?: string | null;
  page_path?: string | null;
  selector?: string | null;
  current_html?: string | null;
  instruction: string;
  status?: string;
  created_at?: string;
}

export async function createChangeRequest(req: ChangeRequest): Promise<void> {
  const { error } = await db.from("edit_change_requests").insert({
    element_key: req.element_key ?? null,
    page_path: req.page_path ?? null,
    selector: req.selector ?? null,
    current_html: req.current_html ?? null,
    instruction: req.instruction,
    created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
  });
  if (error) throw error;

  // Optional: fan out to the cowork-dispatch / n8n bridge if configured.
  const hook = import.meta.env.VITE_COWORK_DISPATCH_URL as string | undefined;
  if (hook) {
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "edit_change_request", ...req }),
      });
    } catch (e) {
      console.warn("[overrides] dispatch webhook failed (request still saved)", e);
    }
  }
}

export async function getChangeRequests(): Promise<ChangeRequest[]> {
  const { data, error } = await db
    .from("edit_change_requests")
    .select("id,element_key,page_path,selector,instruction,status,created_at")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ChangeRequest[];
}
