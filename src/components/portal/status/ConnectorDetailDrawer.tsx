import { Plug, Unplug, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface ConnectorStatus {
  id: string;
  label: string;
  connected: boolean;
}

interface ConnectorDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  connectors: ConnectorStatus[];
  loading: boolean;
}

const ConnectorDetailDrawer = ({ open, onClose, connectors, loading }: ConnectorDetailDrawerProps) => {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="relative">
          <DrawerTitle>Connectors</DrawerTitle>
          <DrawerDescription>External API integrations linked to this project</DrawerDescription>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 h-7 w-7">
              <X size={14} />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">
          {loading && connectors.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground/40">Checking connectors…</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {connectors.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-4 transition-all ${
                    c.connected
                      ? "border-primary/10 bg-primary/[0.03]"
                      : "border-border/40 bg-secondary/20"
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                    c.connected ? "bg-primary/[0.08] text-primary/60" : "bg-muted/50 text-muted-foreground/30"
                  }`}>
                    {c.connected ? <Plug size={16} strokeWidth={1.5} /> : <Unplug size={16} strokeWidth={1.5} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{c.label}</p>
                    <p className={`text-[10px] font-medium ${c.connected ? "text-emerald-500" : "text-muted-foreground/40"}`}>
                      {c.connected ? "Connected" : "Not linked"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ConnectorDetailDrawer;
