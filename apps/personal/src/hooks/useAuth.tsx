import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { clearGateSessions } from "@/lib/portalGate";
import type { User, Session } from "@supabase/supabase-js";

export const AUTH_REDIRECT_KEY = "auth_redirect_after_login";

// A saved post-login route is ordinary browser state, not an authorization
// source. Never allow it to become an external/protocol-relative redirect.
function safeReturnPath(raw: string): string | null {
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") ||
      [...raw].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return null;
  try {
    const route = new URL(raw, window.location.origin);
    return route.origin === window.location.origin
      ? `${route.pathname}${route.search}${route.hash}` : null;
  } catch {
    return null;
  }
}

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // After sign-in, redirect to saved path (e.g. /portal)
      if (event === "SIGNED_IN" && session) {
        // A verified Artist Radar magic link carries its own fixed callback
        // marker, including when opened on a different device. Old portal
        // localStorage paths must not race with that explicit destination.
        const radarCallback = window.location.pathname === "/auth/callback" &&
          new URLSearchParams(window.location.search).get("artist-radar") === "account";
        if (radarCallback) {
          localStorage.removeItem(AUTH_REDIRECT_KEY);
          return;
        }
        const redirectPath = localStorage.getItem(AUTH_REDIRECT_KEY);
        if (redirectPath) {
          localStorage.removeItem(AUTH_REDIRECT_KEY);
          const safePath = safeReturnPath(redirectPath);
          if (!safePath) return;
          // Use setTimeout to avoid navigating during render
          setTimeout(() => navigate(safePath, { replace: true }), 0);
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signInWithGoogle = async () => {
    // Save the page the user came from; after OAuth the onAuthStateChange
    // listener will read this and navigate back.
    const returnPath = location.pathname ? `${location.pathname}${location.search}${location.hash}` : "/portal";
    localStorage.setItem(AUTH_REDIRECT_KEY, returnPath);

    try {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await clearGateSessions();
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
