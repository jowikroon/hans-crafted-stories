// Music Releases data layer — CRUD on public.music_releases with a defensive
// localStorage fallback for when the table doesn't exist yet (the schema ships
// as supabase/migrations-draft/music_releases.sql). Powers the "Releases" mode
// of the Music CMS (admin) and the public /music ReleaseTimeline (read-only).
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ReleaseType = "Single" | "EP" | "Album";

export interface MusicRelease {
  id: string;
  slug: string;
  title: string;
  type: ReleaseType;
  /** YYYY-MM-DD */
  release_date: string;
  genre: string;
  cover: string | null;
  dur: string | null;
  tracks: number | null;
  video: boolean;
  note: string | null;
  visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

const TABLE = "music_releases";
const LOCAL_KEY = "music_cms_local_releases";
const SELECT =
  "id, slug, title, type, release_date, genre, cover, dur, tracks, video, note, visible, sort_order, created_at, updated_at, archived_at";

// The generated Database types don't know music_releases until the migration is
// applied and types are regenerated, so we use the untyped client surface here
// and normalise rows defensively (same approach as songStore).
const db = supabase as unknown as SupabaseClient;

let tableMissing = false;
/** True once a query established that music_releases doesn't exist (yet). */
export const isLocalFallback = (): boolean => tableMissing;

const isMissingTableError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "42P01" || e.code === "PGRST205" || e.code === "PGRST204") return true;
  const msg = (e.message ?? "").toLowerCase();
  return msg.includes(TABLE) && (msg.includes("does not exist") || msg.includes("schema cache"));
};

const nowIso = (): string => new Date().toISOString();
const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const newRelease = (): MusicRelease => ({
  id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
  slug: "",
  title: "",
  type: "Single",
  release_date: todayIso(),
  genre: "",
  cover: null,
  dur: null,
  tracks: null,
  video: false,
  note: null,
  visible: true,
  sort_order: 0,
  created_at: nowIso(),
  updated_at: nowIso(),
  archived_at: null,
});

const toType = (v: unknown): ReleaseType => (v === "EP" || v === "Album" ? v : "Single");
const emptyToNull = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v);
  return s === "" ? null : s;
};

const norm = (r: Record<string, unknown>): MusicRelease => ({
  id: String(r.id),
  slug: (r.slug as string) ?? "",
  title: (r.title as string) ?? "",
  type: toType(r.type),
  release_date: (r.release_date as string) ?? todayIso(),
  genre: (r.genre as string) ?? "",
  cover: emptyToNull(r.cover),
  dur: emptyToNull(r.dur),
  tracks: r.tracks == null || r.tracks === "" ? null : Number(r.tracks),
  video: r.video === true || r.video === "true",
  note: emptyToNull(r.note),
  visible: r.visible !== false,
  sort_order: r.sort_order == null ? 0 : Number(r.sort_order),
  created_at: (r.created_at as string) ?? nowIso(),
  updated_at: (r.updated_at as string) ?? nowIso(),
  archived_at: (r.archived_at as string) ?? null,
});

/** Strip client-only helpers before writing; keep the row DB-shaped. */
const toRow = (rel: MusicRelease): Record<string, unknown> => ({
  id: rel.id,
  slug: rel.slug.trim(),
  title: rel.title,
  type: rel.type,
  release_date: rel.release_date,
  genre: rel.genre,
  cover: emptyToNull(rel.cover),
  dur: emptyToNull(rel.dur),
  tracks: rel.tracks == null || Number.isNaN(rel.tracks) ? null : rel.tracks,
  video: !!rel.video,
  note: emptyToNull(rel.note),
  visible: !!rel.visible,
  sort_order: rel.sort_order ?? 0,
  archived_at: rel.archived_at ?? null,
});

const byDate = (a: MusicRelease, b: MusicRelease): number => {
  if (a.release_date === b.release_date) return a.sort_order - b.sort_order;
  return a.release_date < b.release_date ? -1 : 1;
};

/* ── localStorage fallback ── */
const readLocal = (): MusicRelease[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    return Array.isArray(parsed) ? parsed.map((r) => norm(r as Record<string, unknown>)) : [];
  } catch {
    return [];
  }
};

const writeLocal = (rows: MusicRelease[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
  } catch {
    /* storage full/unavailable — nothing sensible to do */
  }
};

/* ── public API ── */

/**
 * All non-archived releases, oldest first. For the admin this returns hidden
 * rows too (authenticated RLS); for anon the RLS policy already filters to
 * visible rows, but we filter defensively as well via listVisibleReleases.
 */
export async function listReleases(): Promise<MusicRelease[]> {
  if (!tableMissing) {
    const { data, error } = await db
      .from(TABLE)
      .select(SELECT)
      .is("archived_at", null)
      .order("release_date", { ascending: true });
    if (!error) return ((data as Record<string, unknown>[] | null) ?? []).map(norm).sort(byDate);
    if (isMissingTableError(error)) tableMissing = true;
    else throw new Error(error.message);
  }
  return readLocal()
    .filter((r) => !r.archived_at)
    .sort(byDate);
}

/** Public timeline read: visible + non-archived only, oldest first. */
export async function listVisibleReleases(): Promise<MusicRelease[]> {
  const all = await listReleases();
  return all.filter((r) => r.visible && !r.archived_at);
}

export async function saveRelease(rel: MusicRelease): Promise<MusicRelease> {
  const row = toRow(rel);
  if (!tableMissing) {
    const { data, error } = await db.from(TABLE).upsert(row).select(SELECT).maybeSingle();
    if (!error) return data ? norm(data as Record<string, unknown>) : norm(row);
    if (isMissingTableError(error)) tableMissing = true;
    else throw new Error(error.message);
  }
  const merged = { ...rel, updated_at: nowIso() };
  const rest = readLocal().filter((r) => r.id !== merged.id);
  writeLocal([merged, ...rest]);
  return merged;
}

/** Flip the hidden/visible toggle. */
export async function setVisible(id: string, visible: boolean): Promise<void> {
  if (!tableMissing) {
    const { error } = await db.from(TABLE).update({ visible }).eq("id", id);
    if (!error) return;
    if (isMissingTableError(error)) tableMissing = true;
    else throw new Error(error.message);
  }
  writeLocal(readLocal().map((r) => (r.id === id ? { ...r, visible, updated_at: nowIso() } : r)));
}

/** Soft-delete (archive) — never hard-delete a row. */
export async function archiveRelease(id: string): Promise<void> {
  if (!tableMissing) {
    const { error } = await db.from(TABLE).update({ archived_at: nowIso() }).eq("id", id);
    if (!error) return;
    if (isMissingTableError(error)) tableMissing = true;
    else throw new Error(error.message);
  }
  writeLocal(readLocal().map((r) => (r.id === id ? { ...r, archived_at: nowIso() } : r)));
}
