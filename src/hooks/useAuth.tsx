import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { User, Session } from "@supabase/supabase-js";

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
    const returnPath = location.pathname || "/portal";
    localStorage.setItem(AUTH_REDIRECT_KEY, returnPath);

    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        console.error("Google Sign-In error:", result.error);
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
