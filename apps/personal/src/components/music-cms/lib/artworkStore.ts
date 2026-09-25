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

export async function downloadArtwork(asset: ArtworkAsset): Promise<void> {
  const filename = `${asset.family_key}-${asset.id.slice(0, 8)}.${asset.format.toLowerCase()}`;
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
