import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, Shield, Eye, EyeOff, Pencil, ChevronRight, Check, X } from "lucide-react";
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

const PortalUsersManager = ({ adminUserId }: PortalUsersManagerProps) => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<PortalProfile[]>([]);
  const [tools, setTools] = useState<PortalTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PortalProfile | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Tool & content access for selected user
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
      // Create a placeholder user_id (admin will invite them separately via auth)
      const placeholderId = crypto.randomUUID();
      await usersApi.createProfile({ user_id: placeholderId, display_name: newName.trim(), email: newEmail.trim() });
      // Add user role
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

  const selectUser = async (profile: PortalProfile) => {
    setSelectedUser(profile);
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

  const toggleToolAccess = async (toolId: string, field: "can_view" | "can_use") => {
    if (!selectedUser) return;
    const current = toolAccess[toolId] || { can_view: false, can_use: false };
    const updated = { ...current, [field]: !current[field] };
    if (field === "can_use" && updated.can_use) updated.can_view = true;
    setToolAccess((prev) => ({ ...prev, [toolId]: updated }));
    try {
      await usersApi.setToolAccess(selectedUser.user_id, toolId, updated.can_view, updated.can_use, adminUserId);
    } catch {
      toast({ title: "Error", description: "Failed to update access", variant: "destructive" });
    }
  };

  const toggleContentAccess = async (type: string, field: "can_view" | "can_edit") => {
    if (!selectedUser) return;
    const current = contentAccess[type] || { can_view: false, can_edit: false };
    const updated = { ...current, [field]: !current[field] };
    if (field === "can_edit" && updated.can_edit) updated.can_view = true;
    setContentAccess((prev) => ({ ...prev, [type]: updated }));
    try {
      await usersApi.setContentAccess(selectedUser.user_id, type, updated.can_view, updated.can_edit, adminUserId);
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
          {profiles.map((profile) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/20 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <Badge
                  variant={profile.is_active ? "secondary" : "outline"}
                  className="text-[9px]"
                >
                  {profile.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => toggleActive(profile)}
                  title={profile.is_active ? "Deactivate" : "Activate"}
                >
                  {profile.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => selectUser(profile)}
                  title="Manage access"
                >
                  <Shield size={13} />
                </Button>
              </div>
            </motion.div>
          ))}
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

      {/* Access Management Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(v) => { if (!v) setSelectedUser(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield size={16} />
              Access — {selectedUser?.display_name}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-6 overflow-y-auto py-2">
            {/* Tool Access */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tool Access</p>
              <div className="space-y-2">
                {tools.map((tool) => {
                  const access = toolAccess[tool.id] || { can_view: false, can_use: false };
                  return (
                    <div key={tool.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <span className="text-sm text-foreground">{tool.name}</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Switch
                            checked={access.can_view}
                            onCheckedChange={() => toggleToolAccess(tool.id, "can_view")}
                            className="scale-75"
                          />
                          View
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Switch
                            checked={access.can_use}
                            onCheckedChange={() => toggleToolAccess(tool.id, "can_use")}
                            className="scale-75"
                          />
                          Use
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content Access */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content Access</p>
              <div className="space-y-2">
                {contentTypes.map((ct) => {
                  const access = contentAccess[ct.key] || { can_view: false, can_edit: false };
                  return (
                    <div key={ct.key} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <span className="text-sm text-foreground">{ct.label}</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Switch
                            checked={access.can_view}
                            onCheckedChange={() => toggleContentAccess(ct.key, "can_view")}
                            className="scale-75"
                          />
                          View
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Switch
                            checked={access.can_edit}
                            onCheckedChange={() => toggleContentAccess(ct.key, "can_edit")}
                            className="scale-75"
                          />
                          Edit
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortalUsersManager;
