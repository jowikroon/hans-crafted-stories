// WriteCMS — the /write route.
// Renders the Blog CMS shell (3-mode left rail: Write / Manage / Analytics).
// Design is locked — ported from public/write-src.html. Only functionality changes per phase.
import WriteCmsShell from "@/components/write-cms/WriteCmsShell";

export default function WriteCMS() {
  return <WriteCmsShell />;
}
