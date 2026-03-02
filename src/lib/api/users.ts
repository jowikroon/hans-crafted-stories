import { supabase } from "@/integrations/supabase/client";

export interface PortalProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar_url: string;
  is_active: boolean;
  tab_access: string[];
  created_at: string;
  updated_at: string;
}

export interface UserToolAccess {
  id: string;
  user_id: string;
  tool_id: string;
  can_view: boolean;
  can_use: boolean;
  granted_at: string;
  granted_by: string | null;
}

export interface UserContentAccess {
  id: string;
  user_id: string;
  content_type: string;
  can_view: boolean;
  can_edit: boolean;
  granted_at: string;
  granted_by: string | null;
}

export const usersApi = {
  async getProfiles(): Promise<PortalProfile[]> {
    const { data, error } = await supabase
      .from("portal_profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as unknown as PortalProfile[]) || [];
  },

  async createProfile(profile: { user_id: string; display_name: string; email: string }): Promise<PortalProfile> {
    const { data, error } = await supabase
      .from("portal_profiles")
      .insert(profile as never)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as PortalProfile;
  },

  async updateProfile(id: string, updates: Partial<PortalProfile>): Promise<PortalProfile> {
    const { data, error } = await supabase
      .from("portal_profiles")
      .update(updates as never)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as PortalProfile;
  },

  async deleteProfile(id: string): Promise<void> {
    const { error } = await supabase.from("portal_profiles").delete().eq("id", id);
    if (error) throw error;
  },

  // Tool access
  async getToolAccess(userId: string): Promise<UserToolAccess[]> {
    const { data, error } = await supabase
      .from("user_tool_access")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return (data as unknown as UserToolAccess[]) || [];
  },

  async setToolAccess(userId: string, toolId: string, canView: boolean, canUse: boolean, grantedBy: string): Promise<void> {
    const { error } = await supabase
      .from("user_tool_access")
      .upsert({ user_id: userId, tool_id: toolId, can_view: canView, can_use: canUse, granted_by: grantedBy } as never, { onConflict: "user_id,tool_id" });
    if (error) throw error;
  },

  // Content access
  async getContentAccess(userId: string): Promise<UserContentAccess[]> {
    const { data, error } = await supabase
      .from("user_content_access")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return (data as unknown as UserContentAccess[]) || [];
  },

  async setContentAccess(userId: string, contentType: string, canView: boolean, canEdit: boolean, grantedBy: string): Promise<void> {
    const { error } = await supabase
      .from("user_content_access")
      .upsert({ user_id: userId, content_type: contentType, can_view: canView, can_edit: canEdit, granted_by: grantedBy } as never, { onConflict: "user_id,content_type" });
    if (error) throw error;
  },

  // Add role
  async addUserRole(userId: string, role: "admin" | "user"): Promise<void> {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role } as never);
    if (error) throw error;
  },

  // AI model access
  async getAiAccess(userId: string): Promise<{ ai_model: string; can_access: boolean }[]> {
    const { data, error } = await supabase
      .from("user_ai_access" as any)
      .select("ai_model, can_access")
      .eq("user_id", userId);
    if (error) throw error;
    return (data as any) || [];
  },

  async setAiAccess(userId: string, aiModel: string, canAccess: boolean, grantedBy: string): Promise<void> {
    const { error } = await supabase
      .from("user_ai_access" as any)
      .upsert({ user_id: userId, ai_model: aiModel, can_access: canAccess, granted_by: grantedBy } as never, { onConflict: "user_id,ai_model" });
    if (error) throw error;
  },

  // Activity log
  async getActivityLog(userId: string): Promise<{ id: string; user_id: string; action: string; description: string; metadata: Record<string, unknown>; created_at: string }[]> {
    const { data, error } = await supabase
      .from("user_activity_log" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data as any) || [];
  },

  async logActivity(userId: string, action: string, description: string, metadata: Record<string, unknown> = {}): Promise<void> {
    const { error } = await supabase
      .from("user_activity_log" as any)
      .insert({ user_id: userId, action, description, metadata } as never);
    if (error) console.error("Failed to log activity:", error);
  },
};
