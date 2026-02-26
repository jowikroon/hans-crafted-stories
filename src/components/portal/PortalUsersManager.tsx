import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, Shield, Eye, EyeOff, ChevronDown, ChevronRight, Wrench, FileText, Activity, Bot, Terminal, Zap, ShieldCheck, ShieldX, Lock, Unlock, Trash2 } from "lucide-react";
import { usersApi, PortalProfile } from "@/lib/api/users";
import { portalApi, PortalTool } from "@/lib/api/portal";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface PortalUsersManagerProps {
  adminUserId: string;
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

type AccessSection = "tabs" | "tools" | "content" | "ai";

const PortalUsersManager = ({ adminUserId }: PortalUsersManagerProps) => {
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

  // Per-user access state
  const [toolAccess, setToolAccess] = useState<Record<string, { can_view: boolean; can_use: boolean }>>({});
  const [contentAccess, setContentAccess] = useState<Record<string, { can_view: boolean; can_edit: boolean }>>({});
  const [aiAccess, setAiAccess] = useState<Record<string, boolean>>({});

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
    } catch {
      toast({ title: "Error", description: "Failed to update AI access", variant: "destructive" });
    }
  };

  const toggleActive = async (profile: PortalProfile) => {
    try {
      await usersApi.updateProfile(profile.id, { is_active: !profile.is_active });
      loadData();
      toast({ title: profile.is_active ? "Deactivated" : "Activated" });
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (profile: PortalProfile) => {
    if (!confirm(`Remove ${profile.display_name}? This will delete their profile and access rights.`)) return;
    try {
      await usersApi.deleteProfile(profile.id);
      toast({ title: "User removed", description: `${profile.display_name} has been removed.` });
      if (expandedUser === profile.id) setExpandedUser(null);
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to remove user", variant: "destructive" });
    }
  };

  const tabs = (profile: PortalProfile) => profile.tab_access || ["tools", "content", "status"];

  // Access summary counts
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
  ];

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
          {profiles.map((profile) => {
            const isExpanded = expandedUser === profile.id;
            const summary = isExpanded ? getAccessSummary(profile) : null;
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border bg-card/80 backdrop-blur-sm transition-all ${isExpanded ? "border-primary/20 shadow-lg shadow-primary/[0.03]" : "border-border/60 hover:border-primary/15"}`}
              >
                {/* User header row */}
                <div className="flex items-center justify-between p-4">
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

                  <div className="ml-3 flex items-center gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-muted-foreground/40 hover:text-foreground"
                      onClick={() => toggleActive(profile)}
                      title={profile.is_active ? "Deactivate" : "Activate"}
                    >
                      {profile.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-muted-foreground/40 hover:text-destructive"
                      onClick={() => handleDeleteUser(profile)}
                      title="Remove user"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Expanded: Active Directory Panel */}
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
                                onClick={() => setExpandedSection(section.id)}
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
                                        <Switch
                                          checked={access.can_view}
                                          onCheckedChange={() => toggleToolAccess(profile, tool.id, "can_view")}
                                          className="scale-[0.65]"
                                        />
                                        <Eye size={10} /> View
                                      </label>
                                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                                        <Switch
                                          checked={access.can_use}
                                          onCheckedChange={() => toggleToolAccess(profile, tool.id, "can_use")}
                                          className="scale-[0.65]"
                                        />
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
                                        <Switch
                                          checked={access.can_view}
                                          onCheckedChange={() => toggleContentAccess(profile, ct.key, "can_view")}
                                          className="scale-[0.65]"
                                        />
                                        <Eye size={10} /> View
                                      </label>
                                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                                        <Switch
                                          checked={access.can_edit}
                                          onCheckedChange={() => toggleContentAccess(profile, ct.key, "can_edit")}
                                          className="scale-[0.65]"
                                        />
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
                                    <Switch
                                      checked={hasAccess}
                                      onCheckedChange={() => toggleAiAccess(profile, model.key)}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}

                        {/* Access Summary Bar */}
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
    </div>
  );
};

export default PortalUsersManager;
