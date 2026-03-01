import { useState } from "react";
import { CalendarCheck2, ListTodo, History, MessageSquareWarning, Check, Zap, ExternalLink, Copy, Bot, X, RefreshCw } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { WORKFLOWS } from "@/lib/config/workflows";

const MONDAY_BOARD_URL = import.meta.env.VITE_MONDAY_BOARD_URL || "https://hansvl3s-team-company.monday.com/boards/5092430975";

interface MondayEvent {
  id: string;
  event_type: string;
  message: string;
  metadata: Record<string, unknown>;
  monday_item_id: string | null;
  created_at: string;
}

interface MondayDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  events: MondayEvent[];
  loading: boolean;
  onRefresh: () => void;
  onApprove: (eventId: string, workflowName: string, itemId: string, itemName: string, boardId: string) => void;
  approvingId: string | null;
}

const MondayDetailDrawer = ({ open, onClose, events, loading, onRefresh, onApprove, approvingId }: MondayDetailDrawerProps) => {
  const [submenu, setSubmenu] = useState<"todo" | "done">("todo");
  const [urlCopied, setUrlCopied] = useState(false);

  const mondayTriggerAgentUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monday-trigger-agent`;
  const todoEvents = events.filter((e) => e.event_type === "monday_unhandled");
  const doneEvents = events.filter((e) => e.event_type === "monday_dispatched" || e.event_type === "monday_approved").slice(0, 5);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(mondayTriggerAgentUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="relative">
          <DrawerTitle>Monday.com</DrawerTitle>
          <DrawerDescription>Incoming tasks and webhook events</DrawerDescription>
          <div className="absolute right-4 top-4 flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh} disabled={loading}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7"><X size={14} /></Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          {/* Trigger Agent URL */}
          <div className="rounded-xl border border-primary/10 bg-primary/[0.02] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary/60">
                <Bot size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">Trigger Agent webhook</p>
                <p className="text-[10px] text-muted-foreground/70">Use in Monday.com → Integrations → Webhooks</p>
              </div>
              <button
                type="button"
                onClick={copyUrl}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-border/40 bg-secondary/30 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                {urlCopied ? <Check size={12} /> : <Copy size={12} />}
                {urlCopied ? "Copied" : "Copy URL"}
              </button>
            </div>
            <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground/60" title={mondayTriggerAgentUrl}>
              {mondayTriggerAgentUrl}
            </p>
          </div>

          {/* Submenu tabs */}
          <nav className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground/60">
            <button
              onClick={() => setSubmenu("todo")}
              className={`transition-colors hover:text-foreground/80 ${submenu === "todo" ? "text-foreground font-medium" : ""}`}
            >
              <span className="inline-flex items-center gap-1"><ListTodo size={11} /> To do ({todoEvents.length})</span>
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={() => setSubmenu("done")}
              className={`transition-colors hover:text-foreground/80 ${submenu === "done" ? "text-foreground font-medium" : ""}`}
            >
              <span className="inline-flex items-center gap-1"><History size={11} /> Done ({doneEvents.length})</span>
            </button>
          </nav>

          {loading ? (
            <p className="py-8 text-center text-xs text-muted-foreground/40">Loading…</p>
          ) : submenu === "todo" ? (
            todoEvents.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground/40">No new requests</p>
            ) : (
              <div className="space-y-2">
                {todoEvents.map((evt) => {
                  const boardId = String(evt.metadata?.boardId ?? "");
                  const itemLink = evt.monday_item_id
                    ? `https://monday.com/boards/${boardId}/pulses/${evt.monday_item_id}`
                    : MONDAY_BOARD_URL;
                  return (
                    <div key={evt.id} className="group flex items-start gap-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] px-4 py-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500/60">
                        <MessageSquareWarning size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground/90 break-words">{evt.message}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground/50">
                          <span>{new Date(evt.created_at).toLocaleString()}</span>
                          {evt.monday_item_id && (
                            <a href={itemLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary/50 hover:text-primary/80">
                              <ExternalLink size={8} /> Item #{evt.monday_item_id}
                            </a>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {WORKFLOWS.filter((w) => w.name !== "monday-orchestrator").map((wf) => (
                            <button
                              key={wf.name}
                              onClick={() => onApprove(evt.id, wf.name, evt.monday_item_id || "", (evt.metadata?.item_name as string) || evt.message, boardId)}
                              disabled={approvingId === evt.id}
                              className="flex items-center gap-1 rounded-md border border-border/40 bg-secondary/20 px-2 py-1 text-[10px] font-medium text-muted-foreground/70 transition-all hover:border-primary/30 hover:text-primary/80 disabled:opacity-30"
                            >
                              <Check size={10} /> {wf.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : doneEvents.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground/40">No completed items yet</p>
          ) : (
            <div className="space-y-2">
              {doneEvents.map((evt) => {
                const isApproved = evt.event_type === "monday_approved";
                const workflow = (evt.metadata?.workflow as string) ?? (evt.metadata?.resolved_workflow as string);
                const confidence = evt.metadata?.confidence as number | undefined;
                const boardId = String(evt.metadata?.boardId ?? "");
                const itemLink = evt.monday_item_id
                  ? `https://monday.com/boards/${boardId}/pulses/${evt.monday_item_id}`
                  : MONDAY_BOARD_URL;
                return (
                  <div key={evt.id} className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/[0.02] px-4 py-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary/60">
                      {isApproved ? <Check size={12} /> : <Zap size={12} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground/90 break-words">{evt.message}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground/50">
                        {workflow && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary/70">{workflow}</span>}
                        {confidence != null && <span>{(confidence * 100).toFixed(0)}% match</span>}
                        <span>{new Date(evt.created_at).toLocaleString()}</span>
                        {evt.monday_item_id && (
                          <a href={itemLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary/50 hover:text-primary/80">
                            <ExternalLink size={8} /> Item #{evt.monday_item_id}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MondayDetailDrawer;
