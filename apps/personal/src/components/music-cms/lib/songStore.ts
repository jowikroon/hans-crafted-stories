// Music CMS data layer — CRUD on public.music_songs with a defensive
// localStorage fallback for when the table doesn't exist yet (the schema
// ships as supabase/migrations-draft/music_cms.sql and must be applied by
// hand; until then the CMS keeps working on local drafts).
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SongStatus = "draft" | "published";

export interface Song {
  id: string;
  title: string;
  template_id: string | null;
  theme: string;
  source_notes: string;
  lyrics: string;
  deep_analysis: string;
  status: SongStatus;
  created_at: string;
  updated_at: string;
}

const TABLE = "music_songs";
const LOCAL_KEY = "music_cms_local_songs";
const SELECT =
  "id, title, template_id, theme, source_notes, lyrics, deep_analysis, status, created_at, updated_at";

// The generated Database types don't know music_songs until the draft
// migration is applied and types are regenerated, so we use the untyped
// client surface here and normalise rows defensively.
const db = supabase as unknown as SupabaseClient;

let tableMissing = false;
/** True once a query established that music_songs doesn't exist (yet). */
export const isLocalFallback = (): boolean => tableMissing;

const isMissingTableError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "42P01" || e.code === "PGRST205" || e.code === "PGRST204") return true;
  const msg = (e.message ?? "").toLowerCase();
  return msg.includes(TABLE) && (msg.includes("does not exist") || msg.includes("schema cache"));
};

const nowIso = (): string => new Date().toISOString();

export const newSong = (): Song => ({
  id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
  title: "",
  template_id: null,
  theme: "",
  source_notes: "",
  lyrics: "",
  deep_analysis: "",
  status: "draft",
  created_at: nowIso(),
  updated_at: nowIso(),
});

const norm = (r: Record<string, unknown>): Song => ({
  id: String(r.id),
  title: (r.title as string) ?? "",
  template_id: (r.template_id as string) ?? null,
  theme: (r.theme as string) ?? "",
  source_notes: (r.source_notes as string) ?? "",
  lyrics: (r.lyrics as string) ?? "",
  deep_analysis: (r.deep_analysis as string) ?? "",
  status: r.status === "published" ? "published" : "draft",
  created_at: (r.created_at as string) ?? nowIso(),
  updated_at: (r.updated_at as string) ?? nowIso(),
});

/* ── localStorage fallback ── */
const readLocal = (): Song[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    return Array.isArray(parsed) ? parsed.map((r) => norm(r as Record<string, unknown>)) : [];
  } catch {
    return [];
  }
};

const writeLocal = (songs: Song[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(songs));
  } catch {
    /* storage full/unavailable — nothing sensible to do */
  }
};

/* ── public API ── */
export async function listSongs(): Promise<Song[]> {
  if (!tableMissing) {
    const { data, error } = await db.from(TABLE).select(SELECT).order("updated_at", { ascending: false });
    if (!error) return ((data as Record<string, unknown>[] | null) ?? []).map(norm);
    if (isMissingTableError(error)) tableMissing = true;
    else throw new Error(error.message);
  }
  return readLocal().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getSong(id: string): Promise<Song | null> {
  if (!tableMissing) {
    const { data, error } = await db.from(TABLE).select(SELECT).eq("id", id).maybeSingle();
    if (!error) return data ? norm(data as Record<string, unknown>) : null;
    if (isMissingTableError(error)) tableMissing = true;
    else throw new Error(error.message);
  }
  return readLocal().find((s) => s.id === id) ?? null;
}

export async function saveSong(song: Song): Promise<Song> {
  const row = { ...song, updated_at: nowIso() };
  if (!tableMissing) {
    const { data, error } = await db.from(TABLE).upsert(row).select(SELECT).maybeSingle();
    if (!error) return data ? norm(data as Record<string, unknown>) : row;
    if (isMissingTableError(error)) tableMissing = true;
    else throw new Error(error.message);
  }
  const rest = readLocal().filter((s) => s.id !== row.id);
  writeLocal([row, ...rest]);
  return row;
}

export async function deleteSong(id: string): Promise<void> {
  if (!tableMissing) {
    const { error } = await db.from(TABLE).delete().eq("id", id);
    if (!error) return;
    if (isMissingTableError(error)) tableMissing = true;
    else throw new Error(error.message);
  }
  writeLocal(readLocal().filter((s) => s.id !== id));
}
