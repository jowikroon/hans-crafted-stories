import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const FALLBACK_PATH = "/portal";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // A radar magic link can be opened in another browser or on another device.
    // The ordinary auth flow relies on a same-browser localStorage return path,
    // so accept only this single, fixed callback marker for the public radar.
    // Never turn a query-string `next` value into a navigation destination.
    const isRadarAccountCallback = new URLSearchParams(window.location.search)
      .get("artist-radar") === "account";
    if (isRadarAccountCallback) {
      let active = true;
      let redirectQueued = false;
      const afterAuth = () => {
        if (!active || redirectQueued) return;
        redirectQueued = true;
        // Supabase warns against calling auth methods synchronously inside its
        // session-change callback. Navigation is deferred for the same reason.
        window.setTimeout(() => {
          if (active) navigate("/music?artist-radar=account", { replace: true });
        }, 0);
      };

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) afterAuth();
      });
      // Also works when the session was parsed from the URL before this page
      // mounted, or when the visitor was already authenticated on this device.
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) afterAuth();
      }).catch(() => { /* The safe fallback below lets the visitor retry. */ });

      // Invalid/expired links should not leave a visitor on a spinner forever.
      // This opens the sign-in panel, never a falsely 'confirmed' account view.
      const fallback = window.setTimeout(() => {
        if (active && !redirectQueued) {
          navigate("/music?artist-radar=account&auth=retry", { replace: true });
        }
      }, 12000);

      return () => {
        active = false;
        window.clearTimeout(fallback);
        subscription.unsubscribe();
      };
    }

    // Supabase reads the hash from the URL and fires onAuthStateChange(SIGNED_IN)
    // automatically. useAuth already listens for that event and navigates to the
    // stored path. This page just needs to exist so the router doesn't hit NotFound.
    //
    // Fallback: if there is no hash (e.g. user typed /auth/callback manually)
    // and no session, redirect after a short delay so they are never stuck here.
    const hasTokenFragment =
      window.location.hash.includes("access_token") ||
      window.location.search.includes("code=");

    if (!hasTokenFragment) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const dest = session ? FALLBACK_PATH : "/portal";
        setTimeout(() => navigate(dest, { replace: true }), 800);
      });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Loader2 size={24} className="animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
};

export default AuthCallback;
