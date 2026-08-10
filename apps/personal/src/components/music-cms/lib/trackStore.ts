// Production dashboard data layer — read/write on public.music_tracks and
// read on public.music_lyric_versions. Same untyped-client pattern as
// songStore.ts: the generated Database types don't know these tables yet.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Track {
  id: string;
  song_title: string;
  file_name: string;
  file_path: string;
  folder: string;
  variant_label: string;
  track_kind: string;
  status: string;
  source: string;
  first_seen_at: string | null;
  duration_seconds: number | null;
  bpm: number | null;
  musical_key: string | null;
  lufs: number | null;
  format: string | null;
  content_key: string | null;
  file_size_bytes: number | null;
  suno_url: string | null;
  soundcloud_url: string | null;
  spotify_url: string | null;
  neuralanalog_url: string | null;
  external_url: string | null;
  storage_provider: string;
  cluster_confidence: string;
  favorite: boolean;
}

export interface LyricVersion {
  id: string;
  song_title: string;
  variant_label: string;
  stage: string;
  version: number;
  content: string;
  created_at: string;
}

export type TrackUrlField = "neuralanalog_url" | "suno_url" | "soundcloud_url" | "spotify_url";

const db = supabase as unknown as SupabaseClient;
const TABLE = "music_tracks";
const SELECT =
  "id, song_title, file_name, file_path, folder, variant_label, track_kind, status, source, first_seen_at, duration_seconds, bpm, musical_key, lufs, format, content_key, file_size_bytes, suno_url, soundcloud_url, spotify_url, neuralanalog_url, external_url, storage_provider, cluster_confidence, favorite";

/** Alleen http(s) doorlaten. Beschermt tegen opgeslagen `javascript:`-links
 *  die React niet blokkeert (audit 2026-08-10). */
export function safeHttpUrl(v: string | null | undefined): string | null {
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function listTracks(): Promise<Track[]> {
  const { data, error } = await db.from(TABLE).select(SELECT).order("first_seen_at", { ascending: true }).limit(2000);
  if (error) throw new Error(error.message);
  return ((data as unknown[] | null) ?? []) as Track[];
}

export async function setFavorite(id: string, favorite: boolean): Promise<void> {
  const { error } = await db.from(TABLE).update({ favorite, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setTrackUrl(id: string, field: TrackUrlField, value: string | null): Promise<void> {
  if (value !== null && safeHttpUrl(value) === null) {
    throw new Error("Alleen http(s)-links zijn toegestaan");
  }
  const { error } = await db.from(TABLE).update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Review-restpunt: verplaats een versie naar een (andere) song en bevestig de cluster. */
export async function reassignSong(id: string, songTitle: string): Promise<void> {
  const { error } = await db
    .from(TABLE)
    .update({ song_title: songTitle, cluster_confidence: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function confirmCluster(id: string): Promise<void> {
  const { error } = await db
    .from(TABLE)
    .update({ cluster_confidence: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listLyrics(songTitle: string): Promise<LyricVersion[]> {
  const { data, error } = await db
    .from("music_lyric_versions")
    .select("id, song_title, variant_label, stage, version, content, created_at")
    .eq("song_title", songTitle)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as unknown[] | null) ?? []) as LyricVersion[];
}

/** Zet de status van een versie (o.a. 'uitzoeken' -> 'alternative' als het klopt). */
export async function setTrackStatus(id: string, status: string): Promise<void> {
  const { error } = await db.from(TABLE).update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}
