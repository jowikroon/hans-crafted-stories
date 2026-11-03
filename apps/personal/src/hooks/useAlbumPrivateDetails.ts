import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { useAdmin } from "./useAdmin";
import { supabase } from "@/integrations/supabase/client";

export interface AlbumPrivateDetails {
  story: string;
  tracks: Array<{ position: number; title: string; note?: string }>;
  brandGuide: string;
}

/** Reject malformed data instead of rendering unvalidated server content. */
export function parseAlbumPrivateDetails(value: unknown): AlbumPrivateDetails | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (typeof data.story !== "string" || typeof data.brandGuide !== "string" || !Array.isArray(data.tracks)) return null;
  const positions = new Set<number>();
  for (const item of data.tracks) {
    if (!item || typeof item !== "object" || !Number.isInteger(item.position) || item.position < 1 || positions.has(item.position) || typeof item.title !== "string" || (item.note !== undefined && typeof item.note !== "string")) return null;
    positions.add(item.position);
  }
  return { story: data.story, brandGuide: data.brandGuide, tracks: data.tracks.map(({ position, title, note }) => ({ position, title, ...(note === undefined ? {} : { note }) })) };
}

export function useAlbumPrivateDetails(albumSlug: string) {
  const { user } = useAuth();
  const { isAdmin, loading: ownerLoading } = useAdmin();
  const isOwner = !!user && isAdmin && !ownerLoading;
  const key = isOwner ? `${user.id}:${albumSlug}` : "";
  const [state, setState] = useState<{ key: string; loading: boolean; error: boolean; details: AlbumPrivateDetails | null }>({ key: "", loading: false, error: false, details: null });

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setState({ key, loading: !!key, error: false, details: null });
    if (key) {
      void (async () => {
        try {
          // RLS independently requires is_portal_owner(). No local/private fallback.
          // Table is additive; schema draft must be applied before live use.
          const { data, error } = await supabase.from("music_album_private_details" as never)
            .select("details").eq("album_key", albumSlug).abortSignal(controller.signal).maybeSingle();
          const details = error ? null : parseAlbumPrivateDetails((data as unknown as { details?: unknown } | null)?.details);
          if (active) setState({ key, loading: false, error: !!error || !details, details });
        } catch {
          if (active) setState({ key, loading: false, error: true, details: null });
        }
      })();
    }
    return () => { active = false; controller.abort(); };
  }, [key, albumSlug]);

  // Hide synchronously on sign-out, account/album switch, or revoked ownership.
  const current = !!key && state.key === key;
  return {
    isOwner,
    loading: ownerLoading || (isOwner && (!current || state.loading)),
    error: current && state.error,
    details: isOwner && current ? state.details : null,
  };
}
