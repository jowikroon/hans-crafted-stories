// WriteCMS — the /write and /write/:id routes.
// Renders the Blog CMS shell (3-mode left rail: Write / Manage / Analytics).
// Design is locked — ported from public/write-src.html. Only functionality changes per phase.
import { useParams } from "react-router-dom";
import WriteCmsShell from "@/components/write-cms/WriteCmsShell";

export default function WriteCMS() {
  const { id } = useParams<{ id: string }>();
  return <WriteCmsShell postId={id} />;
}
