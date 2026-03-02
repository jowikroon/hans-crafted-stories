import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const FALLBACK_PATH = "/portal";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
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
