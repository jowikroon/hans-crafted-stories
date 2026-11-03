import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/components/LocalizedLink";
import { AUTH_REDIRECT_KEY, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type PreviewState = "idle" | "loading" | "denied" | "unavailable" | "error";
const TRACK = "clarity-control-v2";
const MAX_MP3_BYTES = 3_000_000;

type Props = {
  /** For component tests; production remains off until explicitly configured. */
  previewReady?: boolean;
};

/**
 * Public NEON card. The optional player fetches audio only after server-side
 * Supabase Auth, per-account invitation and source/preview checks. The public
 * build flag is solely UI visibility and is NOT an access-control decision.
 */
export default function ClarityStudioPreview({
  previewReady = import.meta.env.VITE_NEON_CLARITY_V2_PREVIEW_READY === "true",
}: Props) {
  const { user, session, loading } = useAuth();
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const releaseAudio = useCallback(() => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setAudioUrl(null);
  }, []);

  // Revoke a fetched fragment on logout OR when another account signs in.
  useEffect(() => {
    controllerRef.current?.abort();
    releaseAudio();
    setPreviewState("idle");
  }, [session?.user?.id, releaseAudio]);

  useEffect(() => () => {
    controllerRef.current?.abort();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const rememberReturn = () => {
    localStorage.setItem(AUTH_REDIRECT_KEY, window.location.pathname + window.location.search);
  };

  const loadPrivatePreview = async () => {
    if (!previewReady || !user || !session) return;
    controllerRef.current?.abort();
    releaseAudio();
    const controller = new AbortController();
    controllerRef.current = controller;
    setPreviewState("loading");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!token || !supabaseUrl || !publishableKey) throw new Error("session");

      const response = await fetch(supabaseUrl + "/functions/v1/neon-studio-preview", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          apikey: publishableKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ track: TRACK }),
        cache: "no-store",
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (response.status === 401 || response.status === 403) {
        setPreviewState("denied");
        return;
      }
      if (response.status === 404 || response.status === 409) {
        setPreviewState("unavailable");
        return;
      }
      if (!response.ok || !response.headers.get("Content-Type")?.startsWith("audio/mpeg")) {
        throw new Error("response");
      }
      const file = await response.blob();
      if (controller.signal.aborted) return;
      if (file.size <= 0 || file.size > MAX_MP3_BYTES) throw new Error("size");
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setAudioUrl(url);
      setPreviewState("idle");
    } catch {
      if (!controller.signal.aborted) setPreviewState("error");
    }
  };

  return (
    <aside className="mn-preview" aria-label="Clarity Control V2 studio preview">
      <span className="mn-preview__eyebrow"><span className="mn-preview__dot" />Latest studio preview</span>
      <h2 className="mn-preview__title">Clarity Control <span>V2</span></h2>
      <p className="mn-preview__copy">Another part of the signal. Not every detail is shown.</p>
      <div className="mn-preview__signal" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>

      {!previewReady ? (
        <>
          <p className="mn-preview__status">First listen in preparation</p>
          <p className="mn-preview__fine">The full recording stays private until the exact V2 source and access are verified.</p>
        </>
      ) : (
        <div className="mn-preview__gate">
          <p className="mn-preview__status">Invitation-only first listen</p>
          {loading ? (
            <p className="mn-preview__fine" role="status">Checking your session...</p>
          ) : !user ? (
            <>
              <p className="mn-preview__fine">Sign in with your invited website account to request access.</p>
              <Link to="/portal" onClick={rememberReturn} className="mn-preview__action">
                Sign in for first listen
              </Link>
            </>
          ) : (
            <>
              {!audioUrl ? (
                <button type="button" onClick={loadPrivatePreview}
                  disabled={previewState === "loading"} className="mn-preview__action">
                  {previewState === "loading" ? "Checking your invitation..." : "Listen to the preview"}
                </button>
              ) : (
                <audio className="mn-preview__audio" controls controlsList="nodownload" preload="none"
                  src={audioUrl} aria-label="Clarity Control V2 private audio preview" />
              )}
              {previewState === "denied" && <p className="mn-preview__fine mn-preview__error" role="alert">This first listen requires a personal invitation.</p>}
              {previewState === "unavailable" && <p className="mn-preview__fine" role="status">The first listen is still in preparation.</p>}
              {previewState === "error" && <p className="mn-preview__fine mn-preview__error" role="alert">The preview could not be loaded. Please try again later.</p>}
            </>
          )}
          <p className="mn-preview__fine">A short excerpt only. The full master is not available here.</p>
        </div>
      )}
    </aside>
  );
}
