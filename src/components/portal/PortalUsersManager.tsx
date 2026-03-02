import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, Shield, Eye, EyeOff, ChevronDown, ChevronRight, Wrench, FileText, Activity, Bot, Terminal, Zap, ShieldCheck, ShieldX, Lock, Unlock, Trash2, CheckSquare, Square, UserCheck, Loader2, RefreshCw, Clock } from "lucide-react";
import { usersApi, PortalProfile } from "@/lib/api/users";
import { portalApi, PortalTool } from "@/lib/api/portal";
import { useToast } from "@/hooks/use-toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PortalUsersManagerProps {
  adminUserId: string;
  subFilter?: string;
}

const contentTypes = [
  { key: "blog_posts", label: "Blog Posts", icon: FileText },
  { key: "case_studies", label: "Case Studies", icon: FileText },
  { key: "media", label: "Media", icon: FileText },
  { key: "pages", label: "Pages", icon: FileText },
];

const tabOptions = [
  { key: "tools", label: "Tools", icon: Wrench },
  { key: "content", label: "Content", icon: FileText },
  { key: "status", label: "Status", icon: Activity },
];

const aiModels = [
  { key: "empire_ai", label: "Empire AI", icon: Terminal, description: "Infrastructure & n8n management", color: "text-emerald-500" },
  { key: "n8n_agent", label: "n8n Agent", icon: Zap, description: "Workflow builder & troubleshooter", color: "text-purple-500" },
];

type AccessSection = "tabs" | "tools" | "content" | "ai" | "activity";

const PortalUsersManager = ({ adminUserId, subFilter }: PortalUsersManagerProps) => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<PortalProfile[]>([]);
  const [tools, setTools] = useState<PortalTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<AccessSection | null>("tabs");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [userToDelete, setUserToDelete] = useState<PortalProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Per-user access state
  const [toolAccess, setToolAccess] = useState<Record<string, { can_view: boolean; can_use: boolean }>>({});
  const [contentAccess, setContentAccess] = useState<Record<string, { can_view: boolean; can_edit: boolean }>>({});
  const [aiAccess, setAiAccess] = useState<Record<string, boolean>>({});
  const [activityLog, setActivityLog] = useState<{ id: string; action: string; description: string; metadata: Record<string, unknown>; created_at: string }[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkSection, setBulkSection] = useState<AccessSection>("tabs");
  const [bulkTabs, setBulkTabs] = useState<Record<string, boolean>>({});
  const [bulkTools, setBulkTools] = useState<Record<string, { can_view: boolean; can_use: boolean }>>({});
  const [bulkContent, setBulkContent] = useState<Record<string, { can_view: boolean; can_edit: boolean }>>({});
  const [bulkAi, setBulkAi] = useState<Record<string, boolean>>({});
  const [bulkSaving, setBulkSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([usersApi.getProfiles(), portalApi.getTools()]);
      setProfiles(p);
      setTools(t);
    } catch {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Selection helpers ─────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === profiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(profiles.map(p => p.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedProfiles = profiles.filter(p => selectedIds.has(p.id));

  // ── Bulk assign dialog ────────────────────────────
  const openBulkAssign = () => {
    setBulkSection("tabs");
    setBulkTabs({});
    setBulkTools({});
    setBulkContent({});
    setBulkAi({});
    setShowBulkAssign(true);
  };

  const applyBulkPermissions = async () => {
    setBulkSaving(true);
    try {
      const promises: Promise<any>[] = [];

      for (const profile of selectedProfiles) {
        // Tab access
        const activeTabs = Object.entries(bulkTabs).filter(([, v]) => v).map(([k]) => k);
        if (activeTabs.length > 0) {
          const merged = [...new Set([...(profile.tab_access || []), ...activeTabs])];
          promises.push(usersApi.updateProfile(profile.id, { tab_access: merged } as any));
        }

        // Tool access
        for (const [toolId, access] of Object.entries(bulkTools)) {
          if (access.can_view || access.can_use) {
            promises.push(usersApi.setToolAccess(profile.user_id, toolId, access.can_view, access.can_use, adminUserId));
          }
        }

        // Content access
        for (const [ct, access] of Object.entries(bulkContent)) {
          if (access.can_view || access.can_edit) {
            promises.push(usersApi.setContentAccess(profile.user_id, ct, access.can_view, access.can_edit, adminUserId));
          }
        }

        // AI access
        for (const [model, enabled] of Object.entries(bulkAi)) {
          if (enabled) {
            promises.push(usersApi.setAiAccess(profile.user_id, model, true, adminUserId));
          }
        }
      }

      await Promise.all(promises);
      toast({ title: "Permissions applied", description: `Updated ${selectedProfiles.length} user(s).` });
      setShowBulkAssign(false);
      clearSelection();
      loadData();
    } catch {
      toast({ title: "Error", description: "Some permissions failed to apply.", variant: "destructive" });
    } finally {
      setBulkSaving(false);
    }
  };

  const handleAddUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast({ title: "Validation", description: "Name, email, and password are required.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Validation", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-api`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${(await (await import("@/integrations/supabase/client")).supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify({ action: "create_user", email: newEmail.trim(), password: newPassword, display_name: newName.trim(), role: "user", tab_access: ["tools"] }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create user");
      if (result.user_id) {
        usersApi.logActivity(result.user_id, "user_created", `User "${newName.trim()}" created with email ${newEmail.trim()}`);
      }
      toast({ title: "User added", description: `${newName.trim()} has been added with a real account.` });
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setShowAdd(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add user";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const expandUser = async (profile: PortalProfile) => {
    if (expandedUser === profile.id) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(profile.id);
    setExpandedSection("tabs");
    try {
      const [ta, ca, aa] = await Promise.all([
        usersApi.getToolAccess(profile.user_id),
        usersApi.getContentAccess(profile.user_id),
        usersApi.getAiAccess(profile.user_id),
      ]);
      const toolMap: Record<string, { can_view: boolean; can_use: boolean }> = {};
      for (const a of ta) toolMap[a.tool_id] = { can_view: a.can_view, can_use: a.can_use };
      setToolAccess(toolMap);

      const contentMap: Record<string, { can_view: boolean; can_edit: boolean }> = {};
      for (const a of ca) contentMap[a.content_type] = { can_view: a.can_view, can_edit: a.can_edit };
      setContentAccess(contentMap);

      const aiMap: Record<string, boolean> = {};
      for (const a of aa) aiMap[a.ai_model] = a.can_access;
      setAiAccess(aiMap);
    } catch {
      toast({ title: "Error", description: "Failed to load access settings", variant: "destructive" });
    }
  };

  const toggleTabAccess = async (profile: PortalProfile, tab: string) => {
    const current = profile.tab_access || ["tools", "content", "status"];
    const updated = current.includes(tab) ? current.filter(t => t !== tab) : [...current, tab];
    try {
      await usersApi.updateProfile(profile.id, { tab_access: updated } as any);
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, tab_access: updated } : p));
      const added = updated.filter(t => !current.includes(t));
      const removed = current.filter(t => !updated.includes(t));
      if (added.length) usersApi.logActivity(profile.user_id, "tab_granted", `Tab access granted: ${added.join(", ")}`);
      if (removed.length) usersApi.logActivity(profile.user_id, "tab_revoked", `Tab access revoked: ${removed.join(", ")}`);
    } catch {
      toast({ title: "Error", description: "Failed to update tab access", variant: "destructive" });
    }
  };

  const toggleToolAccess = async (profile: PortalProfile, toolId: string, field: "can_view" | "can_use") => {
    const current = toolAccess[toolId] || { can_view: false, can_use: false };
    const updated = { ...current, [field]: !current[field] };
    if (field === "can_use" && updated.can_use) updated.can_view = true;
    if (field === "can_view" && !updated.can_view) updated.can_use = false;
    setToolAccess((prev) => ({ ...prev, [toolId]: updated }));
    try {
      await usersApi.setToolAccess(profile.user_id, toolId, updated.can_view, updated.can_use, adminUserId);
      const toolName = tools.find(t => t.id === toolId)?.name || toolId;
      usersApi.logActivity(profile.user_id, updated.can_view ? "tool_granted" : "tool_revoked", `Tool "${toolName}" — view: ${updated.can_view}, use: ${updated.can_use}`);
    } catch {
      toast({ title: "Error", description: "Failed to update access", variant: "destructive" });
    }
  };

  const toggleContentAccess = async (profile: PortalProfile, type: string, field: "can_view" | "can_edit") => {
    const current = contentAccess[type] || { can_view: false, can_edit: false };
    const updated = { ...current, [field]: !current[field] };
    if (field === "can_edit" && updated.can_edit) updated.can_view = true;
    if (field === "can_view" && !updated.can_view) updated.can_edit = false;
    setContentAccess((prev) => ({ ...prev, [type]: updated }));
    try {
      await usersApi.setContentAccess(profile.user_id, type, updated.can_view, updated.can_edit, adminUserId);
      usersApi.logActivity(profile.user_id, updated.can_view ? "content_granted" : "content_revoked", `Content "${type}" — view: ${updated.can_view}, edit: ${updated.can_edit}`);
    } catch {
      toast({ title: "Error", description: "Failed to update access", variant: "destructive" });
    }
  };

  const toggleAiAccess = async (profile: PortalProfile, model: string) => {
    const current = aiAccess[model] || false;
    const updated = !current;
    setAiAccess((prev) => ({ ...prev, [model]: updated }));
    try {
      await usersApi.setAiAccess(profile.user_id, model, updated, adminUserId);
      const modelLabel = aiModels.find(m => m.key === model)?.label || model;
      usersApi.logActivity(profile.user_id, updated ? "ai_granted" : "ai_revoked", `AI model "${modelLabel}" ${updated ? "enabled" : "disabled"}`);
    } catch {
      toast({ title: "Error", description: "Failed to update AI access", variant: "destructive" });
    }
  };

  const toggleActive = async (profile: PortalProfile) => {
    try {
      await usersApi.updateProfile(profile.id, { is_active: !profile.is_active });
      usersApi.logActivity(profile.user_id, profile.is_active ? "user_deactivated" : "user_activated", `User ${profile.is_active ? "deactivated" : "activated"}`);
      loadData();
      toast({ title: profile.is_active ? "Deactivated" : "Activated" });
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (profile: PortalProfile) => {
    setDeleting(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action: "delete_user", user_id: profile.user_id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete user");
      toast({ title: "User removed", description: `${profile.display_name} has been permanently removed.` });
      if (expandedUser === profile.id) setExpandedUser(null);
      selectedIds.delete(profile.id);
      setSelectedIds(new Set(selectedIds));
      setUserToDelete(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove user";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const tabs = (profile: PortalProfile) => profile.tab_access || ["tools", "content", "status"];

  const getAccessSummary = (profile: PortalProfile) => {
    const t = tabs(profile);
    const toolsVisible = Object.values(toolAccess).filter(a => a.can_view).length;
    const contentVisible = Object.values(contentAccess).filter(a => a.can_view).length;
    const aiEnabled = Object.values(aiAccess).filter(Boolean).length;
    return { tabs: t.length, tools: toolsVisible, totalTools: tools.length, content: contentVisible, totalContent: contentTypes.length, ai: aiEnabled, totalAi: aiModels.length };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  const accessSections: { id: AccessSection; label: string; icon: React.ElementType; description: string }[] = [
    { id: "tabs", label: "Tab Access", icon: Shield, description: "Portal sections visibility" },
    { id: "tools", label: "Tool Permissions", icon: Wrench, description: "Per-tool view & use rights" },
    { id: "content", label: "Content Rights", icon: FileText, description: "CMS view & edit access" },
    { id: "ai", label: "AI Models", icon: Bot, description: "AI assistant access control" },
    { id: "activity", label: "Activity", icon: Activity, description: "Recent user actions" },
  ];

  const loadActivityLog = async (userId: string) => {
    setActivityLoading(true);
    try {
      const log = await usersApi.getActivityLog(userId);
      setActivityLog(log);
    } catch {
      toast({ title: "Error", description: "Failed to load activity log", variant: "destructive" });
    } finally {
      setActivityLoading(false);
    }
  };

  const actionBadgeColor = (action: string) => {
    if (action.includes("grant") || action.includes("activated") || action === "user_created") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (action.includes("revoke") || action.includes("deactivated")) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    return "bg-sky-500/10 text-sky-600 border-sky-500/20";
  };

  const allSelected = profiles.length > 0 && selectedIds.size === profiles.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
              <Users size={15} className="text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">User Permissions</h3>
            <Badge variant="secondary" className="rounded-lg text-[10px] font-medium">{profiles.length} users</Badge>
          </div>
          <p className="text-xs text-muted-foreground/60 ml-[42px]">Manage user access, permissions, and AI model rights</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 text-xs rounded-xl">
          <UserPlus size={13} /> Add User
        </Button>
      </div>

      {/* Select-all row + bulk action bar */}
      {profiles.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} className="h-4 w-4" />
            <span>{allSelected ? "Deselect all" : "Select all"}</span>
          </button>

          <AnimatePresence>
            {someSelected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <Badge variant="outline" className="rounded-lg text-[10px]">
                  {selectedIds.size} selected
                </Badge>
                <Button size="sm" variant="outline" onClick={openBulkAssign} className="gap-1.5 text-xs rounded-xl">
                  <UserCheck size={13} /> Bulk Assign
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection} className="text-xs rounded-xl text-muted-foreground">
                  Clear
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* User list */}
      {profiles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50">
            <Users size={20} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No users yet</p>
          <p className="text-xs text-muted-foreground">Add your first team member to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.filter((p) => {
            if (!subFilter || subFilter === "All") return true;
            const tabCount = (p.tab_access || []).length;
            if (subFilter === "Admins") return tabCount >= 5;
            if (subFilter === "Members") return tabCount < 5;
            return true;
          }).map((profile) => {
            const isExpanded = expandedUser === profile.id;
            const isSelected = selectedIds.has(profile.id);
            const summary = isExpanded ? getAccessSummary(profile) : null;
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border bg-card/80 backdrop-blur-sm transition-all ${
                  isSelected
                    ? "border-primary/30 shadow-md shadow-primary/[0.05] ring-1 ring-primary/10"
                    : isExpanded
                      ? "border-primary/20 shadow-lg shadow-primary/[0.03]"
                      : "border-border/60 hover:border-primary/15"
                }`}
              >
                {/* User header row */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(profile.id)}
                      className="h-4 w-4 shrink-0"
                    />
                    <button onClick={() => expandUser(profile)} className="flex flex-1 items-center gap-3 text-left">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                        profile.is_active
                          ? "bg-gradient-to-br from-primary/15 to-primary/5 text-primary border border-primary/10"
                          : "bg-muted text-muted-foreground/40 border border-border/50"
                      }`}>
                        {profile.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{profile.display_name}</p>
                          {profile.is_active ? (
                            <Badge className="rounded-lg bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-medium">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-lg text-[9px] font-medium text-muted-foreground/50">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">{profile.email}</p>
                      </div>
                      {isExpanded ? <ChevronDown size={14} className="shrink-0 text-primary" /> : <ChevronRight size={14} className="shrink-0 text-muted-foreground/40" />}
                    </button>
                  </div>

                  <div className="ml-3 flex items-center gap-1.5">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground/40 hover:text-foreground" onClick={() => toggleActive(profile)} title={profile.is_active ? "Deactivate" : "Activate"}>
                      {profile.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground/40 hover:text-destructive" onClick={() => setUserToDelete(profile)} title="Remove user">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Expanded: User Permission Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/50 px-4 py-5">
                        {/* Section Nav */}
                        <div className="flex gap-1.5 mb-5 p-1 rounded-xl bg-secondary/40 border border-border/40">
                          {accessSections.map((section) => {
                            const SectionIcon = section.icon;
                            const isActive = expandedSection === section.id;
                            return (
                              <button
                                key={section.id}
                                onClick={() => {
                                  setExpandedSection(section.id);
                                  if (section.id === "activity") loadActivityLog(profile.user_id);
                                }}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-medium transition-all ${
                                  isActive
                                    ? "bg-background text-foreground shadow-sm border border-border/50"
                                    : "text-muted-foreground/60 hover:text-foreground"
                                }`}
                              >
                                <SectionIcon size={12} />
                                <span className="hidden sm:inline">{section.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Tab Access Section */}
                        {expandedSection === "tabs" && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <p className="text-[11px] text-muted-foreground/50 mb-3">Control which portal sections this user can see</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {tabOptions.map((tab) => {
                                const hasAccess = tabs(profile).includes(tab.key);
                                const TabIcon = tab.icon;
                                return (
                                  <button
                                    key={tab.key}
                                    onClick={() => toggleTabAccess(profile, tab.key)}
                                    className={`flex items-center gap-2.5 rounded-xl border p-3 transition-all ${
                                      hasAccess
                                        ? "border-emerald-500/30 bg-emerald-500/5"
                                        : "border-border/50 bg-secondary/20 opacity-60"
                                    }`}
                                  >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${hasAccess ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground/40"}`}>
                                      <TabIcon size={14} />
                                    </div>
                                    <div className="text-left flex-1">
                                      <p className="text-xs font-medium text-foreground">{tab.label}</p>
                                      <p className="text-[10px] text-muted-foreground/50">{hasAccess ? "Granted" : "Blocked"}</p>
                                    </div>
                                    {hasAccess ? <ShieldCheck size={14} className="text-emerald-500/60" /> : <ShieldX size={14} className="text-muted-foreground/20" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}

                        {/* Tool Access Section */}
                        {expandedSection === "tools" && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <p className="text-[11px] text-muted-foreground/50 mb-3">Grant view and use permissions per tool</p>
                            <div className="space-y-1.5">
                              {tools.map((tool) => {
                                const access = toolAccess[tool.id] || { can_view: false, can_use: false };
                                return (
                                  <div key={tool.id} className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                                    access.can_view ? "border-border/50 bg-card" : "border-border/30 bg-secondary/10 opacity-60"
                                  }`}>
                                    <div className="flex items-center gap-2.5">
                                      <div className={`h-2 w-2 rounded-full ${access.can_view ? "bg-emerald-500" : "bg-muted-foreground/20"}`} />
                                      <span className="text-xs font-medium text-foreground">{tool.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                                        <Switch checked={access.can_view} onCheckedChange={() => toggleToolAccess(profile, tool.id, "can_view")} className="scale-[0.65]" />
                                        <Eye size={10} /> View
                                      </label>
                                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                                        <Switch checked={access.can_use} onCheckedChange={() => toggleToolAccess(profile, tool.id, "can_use")} className="scale-[0.65]" />
                                        <Unlock size={10} /> Use
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}

                        {/* Content Access Section */}
                        {expandedSection === "content" && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <p className="text-[11px] text-muted-foreground/50 mb-3">Control CMS read and write permissions</p>
                            <div className="space-y-1.5">
                              {contentTypes.map((ct) => {
                                const access = contentAccess[ct.key] || { can_view: false, can_edit: false };
                                return (
                                  <div key={ct.key} className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                                    access.can_view ? "border-border/50 bg-card" : "border-border/30 bg-secondary/10 opacity-60"
                                  }`}>
                                    <div className="flex items-center gap-2.5">
                                      <div className={`h-2 w-2 rounded-full ${access.can_view ? "bg-sky-500" : "bg-muted-foreground/20"}`} />
                                      <span className="text-xs font-medium text-foreground">{ct.label}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                                        <Switch checked={access.can_view} onCheckedChange={() => toggleContentAccess(profile, ct.key, "can_view")} className="scale-[0.65]" />
                                        <Eye size={10} /> View
                                      </label>
                                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                                        <Switch checked={access.can_edit} onCheckedChange={() => toggleContentAccess(profile, ct.key, "can_edit")} className="scale-[0.65]" />
                                        <Unlock size={10} /> Edit
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}

                        {/* AI Models Section */}
                        {expandedSection === "ai" && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <p className="text-[11px] text-muted-foreground/50 mb-3">Control access to AI assistants and agents</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {aiModels.map((model) => {
                                const hasAccess = aiAccess[model.key] || false;
                                const ModelIcon = model.icon;
                                return (
                                  <div
                                    key={model.key}
                                    className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                                      hasAccess
                                        ? "border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
                                        : "border-border/40 bg-secondary/10 opacity-60"
                                    }`}
                                  >
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${hasAccess ? "bg-gradient-to-br from-primary/15 to-primary/5" : "bg-muted"}`}>
                                      <ModelIcon size={18} className={hasAccess ? model.color : "text-muted-foreground/30"} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-foreground">{model.label}</p>
                                      <p className="text-[10px] text-muted-foreground/50">{model.description}</p>
                                    </div>
                                    <Switch checked={hasAccess} onCheckedChange={() => toggleAiAccess(profile, model.key)} />
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}

                        {/* Activity Log Section */}
                        {expandedSection === "activity" && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[11px] text-muted-foreground/50">Recent actions and permission changes</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1.5 text-[10px] rounded-lg"
                                onClick={() => loadActivityLog(profile.user_id)}
                                disabled={activityLoading}
                              >
                                <RefreshCw size={10} className={activityLoading ? "animate-spin" : ""} />
                                Refresh
                              </Button>
                            </div>
                            {activityLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 size={16} className="animate-spin text-muted-foreground/40" />
                              </div>
                            ) : activityLog.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-border/50 p-6 text-center">
                                <Clock size={16} className="mx-auto mb-2 text-muted-foreground/30" />
                                <p className="text-xs text-muted-foreground/50">No activity recorded yet</p>
                              </div>
                            ) : (
                              <ScrollArea className="h-[280px]">
                                <div className="space-y-1.5 pr-3">
                                  {activityLog.map((entry) => (
                                    <div key={entry.id} className="flex items-start gap-3 rounded-xl border border-border/40 bg-secondary/10 p-3">
                                      <div className="mt-0.5 shrink-0">
                                        <div className={`rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${actionBadgeColor(entry.action)}`}>
                                          {entry.action.replace(/_/g, " ")}
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-foreground">{entry.description}</p>
                                        <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                                          {new Date(entry.created_at).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            )}
                          </motion.div>
                        )}

                        {summary && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 rounded-lg bg-secondary/40 border border-border/30 px-2.5 py-1.5">
                              <Shield size={10} className="text-muted-foreground/40" />
                              <span className="text-[10px] font-medium text-muted-foreground">{summary.tabs}/3 tabs</span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-lg bg-secondary/40 border border-border/30 px-2.5 py-1.5">
                              <Wrench size={10} className="text-muted-foreground/40" />
                              <span className="text-[10px] font-medium text-muted-foreground">{summary.tools}/{summary.totalTools} tools</span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-lg bg-secondary/40 border border-border/30 px-2.5 py-1.5">
                              <FileText size={10} className="text-muted-foreground/40" />
                              <span className="text-[10px] font-medium text-muted-foreground">{summary.content}/{summary.totalContent} content</span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-lg bg-secondary/40 border border-border/30 px-2.5 py-1.5">
                              <Bot size={10} className="text-muted-foreground/40" />
                              <span className="text-[10px] font-medium text-muted-foreground">{summary.ai}/{summary.totalAi} AI</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={16} /> Add User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Display Name</Label>
              <Input id="user-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jane Doe" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jane@example.com" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-password">Password</Label>
              <Input id="user-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleAddUser} disabled={saving} className="rounded-xl">{saving ? "Adding..." : "Add User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={showBulkAssign} onOpenChange={setShowBulkAssign}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck size={16} /> Bulk Assign Permissions
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Apply permissions to <span className="font-semibold text-foreground">{selectedIds.size} selected user(s)</span>. Only enabled toggles will be applied — existing permissions won't be removed.
          </p>

          {/* Section Nav */}
          <div className="flex gap-1.5 p-1 rounded-xl bg-secondary/40 border border-border/40">
            {accessSections.map((section) => {
              const SectionIcon = section.icon;
              const isActive = bulkSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setBulkSection(section.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-medium transition-all ${
                    isActive ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground/60 hover:text-foreground"
                  }`}
                >
                  <SectionIcon size={12} />
                  <span className="hidden sm:inline">{section.label}</span>
                </button>
              );
            })}
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 py-2">
            {/* Bulk Tab Access */}
            {bulkSection === "tabs" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {tabOptions.map((tab) => {
                  const enabled = bulkTabs[tab.key] || false;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setBulkTabs(prev => ({ ...prev, [tab.key]: !prev[tab.key] }))}
                      className={`flex items-center gap-2.5 rounded-xl border p-3 transition-all ${
                        enabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50 bg-secondary/20 opacity-60"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground/40"}`}>
                        <TabIcon size={14} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-xs font-medium text-foreground">{tab.label}</p>
                        <p className="text-[10px] text-muted-foreground/50">{enabled ? "Will grant" : "No change"}</p>
                      </div>
                      {enabled ? <ShieldCheck size={14} className="text-emerald-500/60" /> : <ShieldX size={14} className="text-muted-foreground/20" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Bulk Tool Access */}
            {bulkSection === "tools" && (
              <div className="space-y-1.5">
                {tools.map((tool) => {
                  const access = bulkTools[tool.id] || { can_view: false, can_use: false };
                  return (
                    <div key={tool.id} className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                      access.can_view ? "border-border/50 bg-card" : "border-border/30 bg-secondary/10 opacity-60"
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`h-2 w-2 rounded-full ${access.can_view ? "bg-emerald-500" : "bg-muted-foreground/20"}`} />
                        <span className="text-xs font-medium text-foreground">{tool.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                          <Switch
                            checked={access.can_view}
                            onCheckedChange={() => {
                              const newView = !access.can_view;
                              setBulkTools(prev => ({
                                ...prev,
                                [tool.id]: { can_view: newView, can_use: newView ? access.can_use : false },
                              }));
                            }}
                            className="scale-[0.65]"
                          />
                          <Eye size={10} /> View
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                          <Switch
                            checked={access.can_use}
                            onCheckedChange={() => {
                              const newUse = !access.can_use;
                              setBulkTools(prev => ({
                                ...prev,
                                [tool.id]: { can_view: newUse ? true : access.can_view, can_use: newUse },
                              }));
                            }}
                            className="scale-[0.65]"
                          />
                          <Unlock size={10} /> Use
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bulk Content Access */}
            {bulkSection === "content" && (
              <div className="space-y-1.5">
                {contentTypes.map((ct) => {
                  const access = bulkContent[ct.key] || { can_view: false, can_edit: false };
                  return (
                    <div key={ct.key} className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                      access.can_view ? "border-border/50 bg-card" : "border-border/30 bg-secondary/10 opacity-60"
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`h-2 w-2 rounded-full ${access.can_view ? "bg-sky-500" : "bg-muted-foreground/20"}`} />
                        <span className="text-xs font-medium text-foreground">{ct.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                          <Switch
                            checked={access.can_view}
                            onCheckedChange={() => {
                              const newView = !access.can_view;
                              setBulkContent(prev => ({
                                ...prev,
                                [ct.key]: { can_view: newView, can_edit: newView ? access.can_edit : false },
                              }));
                            }}
                            className="scale-[0.65]"
                          />
                          <Eye size={10} /> View
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                          <Switch
                            checked={access.can_edit}
                            onCheckedChange={() => {
                              const newEdit = !access.can_edit;
                              setBulkContent(prev => ({
                                ...prev,
                                [ct.key]: { can_view: newEdit ? true : access.can_view, can_edit: newEdit },
                              }));
                            }}
                            className="scale-[0.65]"
                          />
                          <Unlock size={10} /> Edit
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bulk AI Access */}
            {bulkSection === "ai" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aiModels.map((model) => {
                  const enabled = bulkAi[model.key] || false;
                  const ModelIcon = model.icon;
                  return (
                    <div
                      key={model.key}
                      className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                        enabled ? "border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" : "border-border/40 bg-secondary/10 opacity-60"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${enabled ? "bg-gradient-to-br from-primary/15 to-primary/5" : "bg-muted"}`}>
                        <ModelIcon size={18} className={enabled ? model.color : "text-muted-foreground/30"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{model.label}</p>
                        <p className="text-[10px] text-muted-foreground/50">{model.description}</p>
                      </div>
                      <Switch checked={enabled} onCheckedChange={() => setBulkAi(prev => ({ ...prev, [model.key]: !prev[model.key] }))} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkAssign(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={applyBulkPermissions} disabled={bulkSaving} className="rounded-xl gap-1.5">
              {bulkSaving ? "Applying..." : <>
                <UserCheck size={13} /> Apply to {selectedIds.size} user(s)
              </>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => { if (!open && !deleting) setUserToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gebruiker verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <span className="font-medium text-foreground">{userToDelete?.display_name}</span> wilt verwijderen? Dit verwijdert permanent het account, profiel en alle toegangsrechten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                if (userToDelete) {
                  handleDeleteUser(userToDelete);
                }
              }}
            >
              {deleting ? <><Loader2 size={14} className="mr-1.5 animate-spin" /> Verwijderen…</> : "Verwijderen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PortalUsersManager;
