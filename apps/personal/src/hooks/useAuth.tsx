import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Supabase wordt dynamisch geimporteerd (perf, okt 2026).
 * AuthProvider hangt onder elke route, dus een statische import trok de
 * volledige @supabase/supabase-js client (~51 KB gz) in het entry-chunk van
 * ook de publieke marketingpagina's, waar niemand is ingelogd.
 * `import type` hierboven is build-time only en kost geen runtime bytes.
 */
const getSupabase = () =>
  import("@/integrations/supabase/client").then((m) => m.supabase);

const AUTH_REDIRECT_KEY = "auth_redirect_after_login";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | undefined;

    (async () => {
      const supabase = await getSupabase();
      if (cancelled) return;

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // After sign-in, redirect to saved path (e.g. /portal)
        if (event === "SIGNED_IN" && session) {
          const redirectPath = localStorage.getItem(AUTH_REDIRECT_KEY);
          if (redirectPath) {
            localStorage.removeItem(AUTH_REDIRECT_KEY);
            // Use setTimeout to avoid navigating during render
            setTimeout(() => navigate(redirectPath, { replace: true }), 0);
          }
        }
      });
      subscription = data.subscription;

      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    })().catch((err) => {
      console.error("Auth init failed:", err);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const signInWithGoogle = async () => {
    // Save the page the user came from; after OAuth the onAuthStateChange
    // listener will read this and navigate back.
    const returnPath = location.pathname ? `${location.pathname}${location.search}${location.hash}` : "/portal";
    localStorage.setItem(AUTH_REDIRECT_KEY, returnPath);

    try {
      const supabase = await getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.error("Google Sign-In error:", error);
        localStorage.removeItem(AUTH_REDIRECT_KEY);
      }
    } catch (err) {
      console.error("Google Sign-In failed:", err);
      localStorage.removeItem(AUTH_REDIRECT_KEY);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
