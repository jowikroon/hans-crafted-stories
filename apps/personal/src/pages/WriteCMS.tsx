// WriteCMS — the /write and /write/:id routes.
// Renders the Blog CMS shell (3-mode left rail: Write / Manage / Analytics).
// Design is locked — ported from public/write-src.html. Only functionality changes per phase.
// Access: admin only. Members and anonymous visitors are redirected to /portal.
import { Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import WriteCmsShell from "@/components/write-cms/WriteCmsShell";

export default function WriteCMS() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  if (loading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={22} className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user || !isAdmin) {
    return <Navigate to="/portal" replace />;
  }
  return <WriteCmsShell postId={id} />;
}
