import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useAdmin } from "./useAdmin";
import type { PortalProfile } from "@/lib/api/users";
import { attemptsApi, LoginOutcome } from "@/lib/api/portalAccess";

export type PortalAccessStatus = "loading" | "admin" | "member" | "denied";

/** Log each (user, outcome) pair once per browser session to avoid spam on tab switches */
const logOnce = (userId: string, email: string | null, outcome: LoginOutcome) => {
  try {
    const key = `portal_attempt_${userId}_${outcome}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch { /* sessionStorage unavailable — still log */ }
  attemptsApi.log(userId, email, outcome);
};

/**
 * Resolves what the signed-in user may see in the portal:
 * - admin: full portal (existing behaviour)
 * - member: active portal_profile (created directly or claimed via portal_invites);
 *   sees only the tabs in profile.tab_access
 * - denied: signed in with Google/e-mail but no access — attempt is logged
 */
export const usePortalAccess = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [status, setStatus] = useState<PortalAccessStatus>("loading");
  const [profile, setProfile] = useState<PortalProfile | null>(null);

  useEffect(() => {
    if (!user) {
      setStatus("loading");
      setProfile(null);
      return;
    }
    if (adminLoading) return;
    let cancelled = false;

    const resolve = async () => {
      if (isAdmin) {
        logOnce(user.id, user.email ?? null, "granted_admin");
        if (!cancelled) { setStatus("admin"); setProfile(null); }
        return;
      }

      let prof: PortalProfile | null = null;
      try {
        const { data } = await supabase
          .from("portal_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        prof = (data as unknown) as PortalProfile | null;

        if (!prof) {
          // First visit after being invited: claim the invite (security definer fn)
          const { data: claimed } = await supabase.rpc("claim_portal_invite" as never);
          if (claimed === true) {
            const retry = await supabase
              .from("portal_profiles")
              .select("*")
              .eq("user_id", user.id)
              .maybeSingle();
            prof = (retry.data as unknown) as PortalProfile | null;
          }
        }
      } catch (err) {
        console.error("Portal access check failed:", err);
      }

      if (cancelled) return;
      if (prof && prof.is_active) {
        logOnce(user.id, user.email ?? null, "granted_member");
        setStatus("member");
        setProfile(prof);
      } else {
        logOnce(user.id, user.email ?? null, "denied");
        setStatus("denied");
        setProfile(null);
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [user, isAdmin, adminLoading]);

  return { status, profile };
};
