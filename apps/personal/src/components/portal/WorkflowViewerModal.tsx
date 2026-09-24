import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileJson, Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WorkflowViewerModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  description: string;
  workflowFile: string;
  workflowName: string;
}

const WorkflowViewerModal = ({ open, onClose, name, description, workflowFile, workflowName }: WorkflowViewerModalProps) => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = workflowFile;
    link.download = workflowFile.split("/").pop() || "workflow.json";
    link.click();
  };

  const handleImportToN8n = () => {
    window.open("https://n8n.srv1402218.hstgr.cloud", "_blank");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="wf-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="wf-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-4 z-50 m-auto flex h-fit max-h-[70vh] max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <FileJson size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-medium text-foreground">{name}</h3>
                  <p className="text-xs text-muted-foreground">{workflowName}</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <FileJson size={10} /> n8n Workflow
                </Badge>
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Zap size={10} /> Automation
                </Badge>
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Calendar size={10} /> Importable
                </Badge>
              </div>

              <div className="rounded-lg border border-border bg-secondary/20 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</p>
                <div className="space-y-2">
                  <Button onClick={handleDownload} variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                    <Download size={13} /> Download Workflow JSON
                  </Button>
                  <Button onClick={handleImportToN8n} variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                    <Zap size={13} /> Open n8n Dashboard
                  </Button>
                </div>
              </div>

              <p className="text-[10px] leading-relaxed text-muted-foreground/60">
                Download the JSON and import it into your n8n instance via Settings → Import Workflow.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WorkflowViewerModal;
