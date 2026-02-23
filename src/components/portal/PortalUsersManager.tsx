import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, Shield, Eye, EyeOff, ChevronDown, ChevronRight, Wrench, FileText, Activity } from "lucide-react";
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
  { key: "blog_posts", label: "Blog Posts" },
  { key: "case_studies", label: "Case Studies" },
  { key: "media", label: "Media" },
  { key: "pages", label: "Pages" },
];

const tabOptions = [
  { key: "tools", label: "Tools", icon: Wrench },
  { key: "content", label: "Content", icon: FileText },
  { key: "status", label: "Status", icon: Activity },
];

const PortalUsersManager = ({ adminUserId }: PortalUsersManagerProps) => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<PortalProfile[]>([]);
  const [tools, setTools] = useState<PortalTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Per-user access state
  const [toolAccess, setToolAccess] = useState<Record<string, { can_view: boolean; can_use: boolean }>>({});
  const [contentAccess, setContentAccess] = useState<Record<string, { can_view: boolean; can_edit: boolean }>>({});

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
    if (!newName.trim() || !newEmail.trim()) {
      toast({ title: "Validation", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const placeholderId = crypto.randomUUID();
      await usersApi.createProfile({ user_id: placeholderId, display_name: newName.trim(), email: newEmail.trim() });
      await usersApi.addUserRole(placeholderId, "user");
      toast({ title: "User added", description: `${newName.trim()} has been added.` });
      setNewName("");
      setNewEmail("");
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
    try {
      const [ta, ca] = await Promise.all([
        usersApi.getToolAccess(profile.user_id),
        usersApi.getContentAccess(profile.user_id),
      ]);
      const toolMap: Record<string, { can_view: boolean; can_use: boolean }> = {};
      for (const a of ta) toolMap[a.tool_id] = { can_view: a.can_view, can_use: a.can_use };
      setToolAccess(toolMap);

      const contentMap: Record<string, { can_view: boolean; can_edit: boolean }> = {};
      for (const a of ca) contentMap[a.content_type] = { can_view: a.can_view, can_edit: a.can_edit };
      setContentAccess(contentMap);
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

  const toggleActive = async (profile: PortalProfile) => {
    try {
      await usersApi.updateProfile(profile.id, { is_active: !profile.is_active });
      loadData();
      toast({ title: profile.is_active ? "Deactivated" : "Activated" });
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Managed Users</h3>
          <Badge variant="secondary" className="text-[10px]">{profiles.length}</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="gap-1.5 text-xs">
          <UserPlus size={13} /> Add User
        </Button>
      </div>

      {/* User list */}
      {profiles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Users size={24} className="mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No users yet. Add your first team member.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => {
            const isExpanded = expandedUser === profile.id;
            const tabs = profile.tab_access || ["tools", "content", "status"];
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-border bg-card transition-all hover:border-primary/20"
              >
                {/* Layer 1: User row with tab access badges */}
                <div className="flex items-center justify-between p-3">
                  <button
                    onClick={() => expandUser(profile)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{profile.display_name}</p>
                        <Badge variant={profile.is_active ? "secondary" : "outline"} className="text-[9px]">
                          {profile.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                    {isExpanded ? <ChevronDown size={14} className="ml-auto shrink-0 text-muted-foreground" /> : <ChevronRight size={14} className="ml-auto shrink-0 text-muted-foreground" />}
                  </button>

                  <div className="ml-2 flex items-center gap-1.5">
                    {/* Layer 1 tab badges */}
                    {tabOptions.map((tab) => {
                      const hasAccess = tabs.includes(tab.key);
                      const TabIcon = tab.icon;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => toggleTabAccess(profile, tab.key)}
                          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all ${
                            hasAccess
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border bg-secondary/50 text-muted-foreground/50"
                          }`}
                          title={`${hasAccess ? "Revoke" : "Grant"} ${tab.label} access`}
                        >
                          <TabIcon size={10} />
                          <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                      );
                    })}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => toggleActive(profile)}
                      title={profile.is_active ? "Deactivate" : "Activate"}
                    >
                      {profile.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                    </Button>
                  </div>
                </div>

                {/* Layer 2: Expanded per-tool/per-content rights */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-4 py-4 space-y-5">
                        {/* Tool Access */}
                        {tabs.includes("tools") && (
                          <div>
                            <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              <Wrench size={11} /> Per-Tool Access
                            </p>
                            <div className="space-y-1.5">
                              {tools.map((tool) => {
                                const access = toolAccess[tool.id] || { can_view: false, can_use: false };
                                return (
                                  <div key={tool.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                                    <span className="text-xs font-medium text-foreground">{tool.name}</span>
                                    <div className="flex items-center gap-3">
                                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <Switch
                                          checked={access.can_view}
                                          onCheckedChange={() => toggleToolAccess(profile, tool.id, "can_view")}
                                          className="scale-[0.65]"
                                        />
                                        View
                                      </label>
                                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <Switch
                                          checked={access.can_use}
                                          onCheckedChange={() => toggleToolAccess(profile, tool.id, "can_use")}
                                          className="scale-[0.65]"
                                        />
                                        Use
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Content Access */}
                        {tabs.includes("content") && (
                          <div>
                            <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              <FileText size={11} /> Per-Content Access
                            </p>
                            <div className="space-y-1.5">
                              {contentTypes.map((ct) => {
                                const access = contentAccess[ct.key] || { can_view: false, can_edit: false };
                                return (
                                  <div key={ct.key} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                                    <span className="text-xs font-medium text-foreground">{ct.label}</span>
                                    <div className="flex items-center gap-3">
                                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <Switch
                                          checked={access.can_view}
                                          onCheckedChange={() => toggleContentAccess(profile, ct.key, "can_view")}
                                          className="scale-[0.65]"
                                        />
                                        View
                                      </label>
                                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <Switch
                                          checked={access.can_edit}
                                          onCheckedChange={() => toggleContentAccess(profile, ct.key, "can_edit")}
                                          className="scale-[0.65]"
                                        />
                                        Edit
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* If-this-then-that summary */}
                        <div className="rounded-md bg-secondary/50 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Access Summary</p>
                          <div className="space-y-1">
                            {!tabs.includes("tools") && (
                              <p className="text-[11px] text-muted-foreground">⛔ Tools tab — <span className="text-destructive font-medium">blocked</span></p>
                            )}
                            {tabs.includes("tools") && (
                              <p className="text-[11px] text-muted-foreground">
                                ✅ Tools tab — {Object.values(toolAccess).filter(a => a.can_view).length}/{tools.length} visible
                              </p>
                            )}
                            {!tabs.includes("content") && (
                              <p className="text-[11px] text-muted-foreground">⛔ Content tab — <span className="text-destructive font-medium">blocked</span></p>
                            )}
                            {tabs.includes("content") && (
                              <p className="text-[11px] text-muted-foreground">
                                ✅ Content tab — {Object.values(contentAccess).filter(a => a.can_view).length}/{contentTypes.length} visible
                              </p>
                            )}
                            {!tabs.includes("status") && (
                              <p className="text-[11px] text-muted-foreground">⛔ Status tab — <span className="text-destructive font-medium">blocked</span></p>
                            )}
                            {tabs.includes("status") && (
                              <p className="text-[11px] text-muted-foreground">✅ Status tab — <span className="text-primary font-medium">visible</span></p>
                            )}
                          </div>
                        </div>
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
              <Input id="user-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={saving}>{saving ? "Adding..." : "Add User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortalUsersManager;
