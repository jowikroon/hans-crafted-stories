import { Database, Shield, Zap, Globe, Server } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Status = "online" | "offline" | "checking";

interface Resource {
  icon: typeof Server;
  label: string;
  status: Status;
  latency?: number;
  endpoint?: string;
  lastError?: string;
}

interface HealthDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  resources: Resource[];
}

const StatusDot = ({ status, latency }: { status: Status; latency?: number }) => {
  if (status === "checking") return <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/30 animate-pulse" />;
  if (status === "offline") return <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive" />;
  const color = !latency || latency < 200 ? "bg-emerald-500" : latency < 500 ? "bg-amber-500" : "bg-destructive";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
};

const HealthDetailDrawer = ({ open, onClose, resources }: HealthDetailDrawerProps) => {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="relative">
          <DrawerTitle>System Health</DrawerTitle>
          <DrawerDescription>Per-service status, latency and error details</DrawerDescription>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 h-7 w-7">
              <X size={14} />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => {
              const Icon = r.icon;
              const isOnline = r.status === "online";
              const isChecking = r.status === "checking";
              return (
                <div
                  key={r.label}
                  className={`flex flex-col items-center gap-3 rounded-2xl border px-4 py-5 transition-all ${
                    isOnline
                      ? "border-primary/10 bg-primary/[0.03]"
                      : isChecking
                        ? "border-border/40 bg-secondary/20"
                        : "border-destructive/10 bg-destructive/[0.02]"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                      isOnline
                        ? "bg-primary/[0.08] text-primary/60"
                        : isChecking
                          ? "bg-muted/50 text-muted-foreground/40"
                          : "bg-destructive/[0.06] text-destructive/50"
                    }`}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70">
                    {r.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={r.status} latency={r.latency} />
                    {r.latency !== undefined && isOnline && (
                      <span className="text-[10px] tabular-nums text-muted-foreground/40">{r.latency}ms</span>
                    )}
                  </div>
                  {r.endpoint && (
                    <p className="text-muted-foreground/50 font-mono text-[10px] truncate max-w-full">{r.endpoint}</p>
                  )}
                  {r.lastError && (
                    <p className="text-destructive/60 text-[10px] break-words text-center">{r.lastError}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default HealthDetailDrawer;
