import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import PortalStatusTab from "@/components/portal/PortalStatusTab";

interface StatusDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StatusDrawer = ({ open, onOpenChange }: StatusDrawerProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(100vw-2rem,480px)] overflow-y-auto border-l border-border bg-background p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-sm font-medium">System Status</SheetTitle>
        </SheetHeader>
        <div className="p-6">
          <PortalStatusTab />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StatusDrawer;
