import { supabase } from "@/integrations/supabase/client";
import type { GithubPatch, Unresolved } from "@/lib/editSource/resolve";
import { expandSourceMap, type EditSourceMap, type WireSourceMap } from "@/lib/editSource/codec";

// overlay_source_edits / page_overrides extras are not in the generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type SourceEditStatus =
  | "queued"
  | "processing"
  | "committed"
  | "live"
  | "done"
  | "needs_manual"
  | "failed"
  | "cancelled";

export interface PageContentPatch {
  kind: "page_content";
  id: string;
  page: string;
  content_key: string;
  created_key?: boolean;
}

export type SourcePatch = GithubPatch | Unresolved | PageContentPatch;

export interface SourceEdit {
  id: string;
  created_at: string;
  updated_at: string;
  status: SourceEditStatus;
  mode: "auto_merge" | "pr_only" | "dry_run";
  page_path: string;
  lang: string | null;
  element_key: string | null;
  data_src: string | null;
  old_text: string;
  new_text: string;
  patch: SourcePatch | null;
  target: string | null;
  pr_number: number | null;
  pr_url: string | null;
  merge_sha: string | null;
  error: string | null;
}

const COLS =
  "id,created_at,updated_at,status,mode,page_path,lang,element_key,data_src,old_text,new_text,patch,target,pr_number,pr_url,merge_sha,error";

export async function createSourceEdit(row: {
  page_path: string;
  lang: string;
  element_key: string;
  data_src: string | null;
  old_text: string;
  new_text: string;
  patch: SourcePatch;
  status: SourceEditStatus;
  target?: string | null;
  error?: string | null;
}): Promise<SourceEdit> {
  const { data, error } = await db.from("overlay_source_edits").insert(row).select(COLS).single();
  if (error) throw error;
  return data as SourceEdit;
}

export async function getSourceEdit(id: string): Promise<SourceEdit | null> {
  const { data } = await db.from("overlay_source_edits").select(COLS).eq("id", id).maybeSingle();
  return (data as SourceEdit) ?? null;
}

export async function listRecentSourceEdits(limit = 6): Promise<SourceEdit[]> {
  const { data } = await db.from("overlay_source_edits").select(COLS).order("created_at", { ascending: false }).limit(limit);
  return (data as SourceEdit[]) ?? [];
}

/** Realtime updates for one job; returns an unsubscribe function. */
export function watchSourceEdit(id: string, onChange: (row: SourceEdit) => void): () => void {
  const channel = supabase
    .channel(`overlay_source_edit_${id}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "overlay_source_edits", filter: `id=eq.${id}` }, (payload) => {
      onChange(payload.new as SourceEdit);
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** page_content rows whose value is exactly this text (CMS-backed copy). */
export async function findPageContentByValue(value: string): Promise<{ id: string; page: string; content_key: string; content_value: string; content_group: string; content_label: string; content_type: string; sort_order: number }[]> {
  const { data } = await db
    .from("page_content")
    .select("id,page,content_key,content_value,content_group,content_label,content_type,sort_order")
    .eq("content_value", value)
    .limit(5);
  return data ?? [];
}

let mapPromise: Promise<EditSourceMap | null> | null = null;

/** /__edit/source-map.json of the running build (loaded once, admin/edit mode only). */
export function loadSourceMap(): Promise<EditSourceMap | null> {
  if (!mapPromise) {
    mapPromise = fetch("/__edit/source-map.json", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<WireSourceMap>) : null))
      .then((w) => (w && w.v === 1 ? expandSourceMap(w) : null))
      .catch(() => null)
      .then((m) => {
        if (!m) mapPromise = null; // allow a retry on the next save
        return m;
      });
  }
  return mapPromise;
}
