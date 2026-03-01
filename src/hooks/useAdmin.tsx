import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const ENV_ADMIN_EMAILS: string[] = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

// Always include hansvl3@gmail.com; merge with env so admin works even if env is missing
const ADMIN_EMAILS: string[] = [
  ...new Set([...ENV_ADMIN_EMAILS, "hansvl3@gmail.com"]),
];

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const email = user.email?.trim().toLowerCase();

    // If the user's email is in the allowlist, grant admin immediately
    if (email && ADMIN_EMAILS.includes(email)) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(!error && data === true);
      setLoading(false);
    };

    checkAdmin();
  }, [user]);

  return { isAdmin, loading };
};
