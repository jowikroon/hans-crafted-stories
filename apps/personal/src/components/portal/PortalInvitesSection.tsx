import { useState, useEffect, useCallback } from "react";
import { Mail, Copy, Ban, Loader2, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { invitesApi, PortalInvite } from "@/lib/api/portalAccess";

interface Props {
  adminUserId: string;
}

function inviteStatus(inv: PortalInvite): { label: string; cls: string } {
  if (inv.revoked_at) return { label: "Revoked", cls: "text-red-500 bg-red-500/10 border-red-500/20" };
  if (inv.accepted_at) return { label: "Accepted", cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
  return { label: "Pending", cls: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
}

const PortalInvitesSection = ({ adminUserId }: Props) => {
  const { toast } = useToast();
  const [invites, setInvites] = useState<PortalInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setInvites(await invitesApi.list()); }
    catch (e) { console.error("Failed to load invites:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await invitesApi.create(trimmed, name, adminUserId);
      toast({ title: "Invite created", description: `${trimmed} can now sign in with Google and will only see the Tools section.` });
      setEmail(""); setName("");
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create invite";
      toast({ title: "Invite failed", description: msg.includes("duplicate") ? "This email address was already invited." : msg, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleRevoke = async (inv: PortalInvite) => {
    if (!confirm(`Revoke invite for ${inv.email}?`)) return;
    try {
      await invitesApi.revoke(inv.id);
      toast({ title: "Invite revoked" });
      load();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to revoke", variant: "destructive" });
    }
  };

  const copyLink = (inv: PortalInvite) => {
    const text = `You've been invited to the tools portal on hansvanleeuwen.com.\n\n1. Go to https://hansvanleeuwen.com/portal\n2. Click "Sign in with Google" using ${inv.email}\n\nYou'll land directly in the Tools section.`;
    navigator.clipboard.writeText(text).then(
      () => toast({ title: "Invite text copied", description: "Paste it in WhatsApp or an email." }),
      () => toast({ title: "Copy failed", variant: "destructive" }),
    );
  };

  return (
    <div className="rounded-2xl border border-border p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
            <UserPlus size={15} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Invite via Google</h3>
            <p className="text-xs text-muted-foreground/60">Invitees sign in with their own Google account and only see the Tools section</p>
          </div>
        </div>
        <button onClick={load} className="text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <form onSubmit={handleInvite} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input type="email" placeholder="friend@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 text-sm" />
        <Input type="text" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 text-sm" />
        <Button type="submit" disabled={saving} size="sm" className="gap-1.5 rounded-xl text-xs">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />} Invite
        </Button>
      </form>

      {invites.length === 0 && !loading ? (
        <p className="text-xs text-muted-foreground/60">No invites yet. Invite someone by email — they sign in with Google, no password needed.</p>
      ) : (
        <div className="space-y-1.5">
          {invites.map((inv) => {
            const st = inviteStatus(inv);
            return (
              <div key={inv.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs">
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{inv.email}</span>
                {inv.display_name && <span className="hidden truncate text-muted-foreground sm:inline">{inv.display_name}</span>}
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${st.cls}`}>{st.label}</span>
                {!inv.revoked_at && !inv.accepted_at && (
                  <button onClick={() => copyLink(inv)} className="text-muted-foreground hover:text-foreground transition-colors" title="Copy invite text">
                    <Copy size={13} />
                  </button>
                )}
                {!inv.revoked_at && (
                  <button onClick={() => handleRevoke(inv)} className="text-muted-foreground hover:text-red-500 transition-colors" title="Revoke invite">
                    <Ban size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PortalInvitesSection;
