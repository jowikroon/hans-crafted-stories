import { Server, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

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

const latencyColor = (ms: number) =>
  ms < 200 ? "hsl(160, 60%, 45%)" : ms < 500 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)";

const LatencySparkChart = ({ resources }: { resources: Resource[] }) => {
  const data = resources
    .filter((r) => r.status === "online" && r.latency !== undefined)
    .map((r) => ({ name: r.label, ms: r.latency! }));

  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-secondary/20 px-4 py-4">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70">
        Response latency
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            unit="ms"
            width={45}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(value: number) => [`${value}ms`, "Latency"]}
          />
          <Bar dataKey="ms" radius={[4, 4, 0, 0]} maxBarSize={32}>
            {data.map((entry, i) => (
              <Cell key={i} fill={latencyColor(entry.ms)} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
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
        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          <LatencySparkChart resources={resources} />

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
