import { supabase } from "@/integrations/supabase/client";

export interface PortalInvite {
  id: string;
  email: string;
  display_name: string | null;
  tab_access: string[];
  invited_by: string | null;
  created_at: string;
  accepted_at: string | null;
  accepted_user_id: string | null;
  revoked_at: string | null;
}

export type LoginOutcome = "granted_admin" | "granted_member" | "denied";

export interface PortalLoginAttempt {
  id: string;
  user_id: string | null;
  email: string | null;
  outcome: LoginOutcome;
  user_agent: string | null;
  device: string | null;
  created_at: string;
}

/** Human-readable browser name from a user agent string */
export function parseBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "Other";
}

/** "Mobile · iOS" style device summary from a user agent string */
export function parseDevice(ua: string): string {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  const os = /Windows/i.test(ua) ? "Windows"
    : /iPhone|iPad|iPod/i.test(ua) ? "iOS"
    : /Mac OS X|Macintosh/i.test(ua) ? "macOS"
    : /Android/i.test(ua) ? "Android"
    : /Linux/i.test(ua) ? "Linux"
    : "Other";
  return `${isMobile ? "Mobile" : "Desktop"} · ${os}`;
}

export const invitesApi = {
  async list(): Promise<PortalInvite[]> {
    const { data, error } = await supabase
      .from("portal_invites" as unknown)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown) as PortalInvite[];
  },

  async create(email: string, displayName: string, invitedBy: string): Promise<PortalInvite> {
    const { data, error } = await supabase
      .from("portal_invites" as unknown)
      .insert({
        email: email.trim().toLowerCase(),
        display_name: displayName.trim() || null,
        invited_by: invitedBy,
        tab_access: ["tools"],
      } as never)
      .select()
      .single();
    if (error) throw error;
    return (data as unknown) as PortalInvite;
  },

  async revoke(id: string): Promise<void> {
    const { error } = await supabase
      .from("portal_invites" as unknown)
      .update({ revoked_at: new Date().toISOString() } as never)
      .eq("id", id);
    if (error) throw error;
  },
};

export const attemptsApi = {
  async list(limit = 100): Promise<PortalLoginAttempt[]> {
    const { data, error } = await supabase
      .from("portal_login_attempts" as unknown)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as unknown) as PortalLoginAttempt[];
  },

  /** Fire-and-forget: log a completed sign-in and its access outcome */
  async log(userId: string, email: string | null, outcome: LoginOutcome): Promise<void> {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const { error } = await supabase
      .from("portal_login_attempts" as unknown)
      .insert({
        user_id: userId,
        email,
        outcome,
        user_agent: ua,
        device: parseDevice(ua),
      } as never);
    if (error) console.error("Failed to log login attempt:", error);
  },
};
