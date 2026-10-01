import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { ArtworkAsset } from "./artworkModel";

const db = supabase as unknown as SupabaseClient;
const BUCKET = "music-artwork";

export async function listArtwork(): Promise<ArtworkAsset[]> {
  const { data: admin, error: authError } = await db.rpc("is_admin");
  if (authError) throw new Error("De toegang kon niet worden gecontroleerd. Probeer opnieuw.");
  if (!admin) throw new Error("Deze beeldbank is alleen beschikbaar voor het admin-account.");
  const result: ArtworkAsset[] = [];
  // PostgREST has a default row cap. Always page through the complete archive.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("music_artwork_assets").select("*").order("id").range(offset, offset + 499);
    if (error) throw new Error("De beeldbank kon niet worden geladen. Probeer opnieuw.");
    result.push(...(data as ArtworkAsset[]));
    if (data.length < 500) break;
  }
  return result;
}

export async function previewUrls(assets: ArtworkAsset[]): Promise<Record<string, string>> {
  const paths = [...new Set(assets.flatMap(a => a.thumbnail_path ? [a.thumbnail_path] : []))];
  if (!paths.length) return {};
  const { data, error } = await db.storage.from(BUCKET).createSignedUrls(paths, 900);
  if (error) throw new Error("De previews konden niet worden geladen.");
  return Object.fromEntries((data ?? []).filter(p => p.signedUrl && !p.error).map(p => [p.path, p.signedUrl]));
}

export async function playbackUrl(asset: ArtworkAsset): Promise<string> {
  if (asset.media_type !== "video" || !asset.playback_path) throw new Error("Geen videopreview beschikbaar.");
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(asset.playback_path, 3600);
  if (error || !data) throw new Error("De video kon niet worden geladen. Probeer opnieuw.");
  return data.signedUrl;
}

export async function originalVideoBlob(asset: ArtworkAsset, onProgress?: (percent: number) => void): Promise<Blob> {
  const parts = asset.original_parts ?? [];
  if (!parts.length) throw new Error("Geen originele videodelen beschikbaar.");
  const buffers: ArrayBuffer[] = [];
  let received = 0;
  for (const path of parts) {
    const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 300);
    if (error || !data) throw new Error("Het originele bestand kon niet worden opgehaald.");
    const response = await fetch(data.signedUrl);
    if (!response.ok) throw new Error("Download onderbroken. Probeer opnieuw.");
    const buffer = await response.arrayBuffer();
    buffers.push(buffer); received += buffer.byteLength;
    onProgress?.(Math.min(99, Math.round(received / asset.bytes * 100)));
  }
  if (received !== asset.bytes) throw new Error("Het bestand is onvolledig. Probeer opnieuw.");
  const blob = new Blob(buffers, { type: "video/mp4" });
  // Imported IDs are SHA-256 hashes of the unchanged original bytes.
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  if (hash !== asset.id) throw new Error("Bestandscontrole mislukt. Probeer opnieuw.");
  onProgress?.(100);
  return blob;
}

export async function downloadArtwork(asset: ArtworkAsset, onProgress?: (percent: number) => void): Promise<void> {
  const filename = `${asset.family_key}-${asset.id.slice(0, 8)}.${asset.format.toLowerCase()}`;
  if (asset.original_parts?.length) {
    const blob = await originalVideoBlob(asset, onProgress);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(asset.storage_path, 60, { download: filename });
  if (error || !data) throw new Error("De download kon niet worden gestart. Probeer opnieuw.");
  const link = document.createElement("a");
  link.href = data.signedUrl;
  link.rel = "noopener";
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
