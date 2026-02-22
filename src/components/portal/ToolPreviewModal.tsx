import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X, ExternalLink } from "lucide-react";
import { PortalTool } from "@/lib/api/portal";
import { Wrench, Workflow, Globe } from "lucide-react";

const iconMap: Record<string, typeof Wrench> = { Wrench, Workflow, Globe };
const getIcon = (name: string) => iconMap[name] || Wrench;

interface ToolPreviewModalProps {
  tool: PortalTool | null;
  onClose: () => void;
  onEdit: (tool: PortalTool) => void;
  onOpen: (tool: PortalTool) => void;
}

const ToolPreviewModal = ({ tool, onClose, onEdit, onOpen }: ToolPreviewModalProps) => {
  if (!tool) return null;
  const Icon = getIcon(tool.icon || "Wrench");

  return (
    <AnimatePresence>
      {tool && (
        <>
          {/* Darkened backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card popup */}
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-8 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X size={16} />
            </button>

            {/* Edit button */}
            <button
              onClick={() => onEdit(tool)}
              className="absolute right-12 top-4 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Edit tool"
            >
              <Pencil size={14} />
            </button>

            {/* Content with hierarchy */}
            <div className="flex flex-col items-start gap-5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-secondary ${tool.color}`}>
                <Icon size={24} />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  {tool.tool_type === "webhook" ? "Automation" : tool.tool_type === "keyword" ? "Research" : tool.tool_type === "site-audit" ? "Audit" : "Tool"}
                </p>
                <h2 className="font-display text-2xl font-medium text-foreground">
                  {tool.name}
                </h2>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {tool.description || "No description provided."}
              </p>

              <button
                onClick={() => onOpen(tool)}
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
              >
                Open Tool
                <ExternalLink size={14} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ToolPreviewModal;
