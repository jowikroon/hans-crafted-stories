import { Check, X, RefreshCw } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { WORKFLOWS } from "@/lib/config/workflows";

interface UnhandledIntent {
  id: string;
  user_input: string;
  source: string;
  fast_route_score: number | null;
  llm_intent: string | null;
  llm_confidence: number | null;
  resolved: boolean;
  resolved_workflow: string | null;
  created_at: string;
}

interface IntentsDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  intents: UnhandledIntent[];
  loading: boolean;
  onRefresh: () => void;
  onResolve: (intentId: string, workflowName: string) => void;
  onDismiss: (intentId: string) => void;
  resolvingId: string | null;
}

const IntentsDetailDrawer = ({ open, onClose, intents, loading, onRefresh, onResolve, onDismiss, resolvingId }: IntentsDetailDrawerProps) => {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="relative">
          <DrawerTitle>Unhandled Intents</DrawerTitle>
          <DrawerDescription>User inputs that couldn't be matched to a workflow</DrawerDescription>
          <div className="absolute right-4 top-4 flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh} disabled={loading}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7"><X size={14} /></Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">
          {loading ? (
            <p className="py-8 text-center text-xs text-muted-foreground/40">Loading…</p>
          ) : intents.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground/40">No unhandled intents — all clear</p>
          ) : (
            <div className="space-y-2">
              {intents.map((intent) => (
                <div key={intent.id} className="group flex items-start gap-3 rounded-xl border border-border/30 bg-secondary/10 px-4 py-3 transition-all hover:border-border/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground/90 break-words">"{intent.user_input}"</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground/50">
                      <span className="uppercase tracking-wider">{intent.source}</span>
                      {intent.fast_route_score != null && <span>Score: {(intent.fast_route_score * 100).toFixed(0)}%</span>}
                      {intent.llm_intent && intent.llm_intent !== "unknown" && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-500/70">
                          LLM: {intent.llm_intent} ({((intent.llm_confidence ?? 0) * 100).toFixed(0)}%)
                        </span>
                      )}
                      <span>{new Date(intent.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {WORKFLOWS.map((wf) => (
                        <button
                          key={wf.name}
                          onClick={() => onResolve(intent.id, wf.name)}
                          disabled={resolvingId === intent.id}
                          className="flex items-center gap-1 rounded-md border border-border/40 bg-secondary/20 px-2 py-1 text-[10px] font-medium text-muted-foreground/70 transition-all hover:border-primary/30 hover:text-primary/80 disabled:opacity-30"
                        >
                          <Check size={10} /> {wf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => onDismiss(intent.id)}
                    disabled={resolvingId === intent.id}
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/30 transition-all hover:bg-destructive/10 hover:text-destructive/60 disabled:opacity-30"
                    title="Dismiss"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default IntentsDetailDrawer;
