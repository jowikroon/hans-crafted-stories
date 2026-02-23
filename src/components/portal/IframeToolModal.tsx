import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";

interface IframeToolModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

const IframeToolModal = ({ open, onClose, url, title }: IframeToolModalProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="iframe-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="iframe-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed z-50 overflow-hidden rounded-xl border border-border bg-card shadow-2xl transition-all duration-300 ${
              expanded
                ? "inset-2"
                : "inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[80vh] sm:max-h-[720px] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                </div>
                <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px] sm:max-w-sm">
                  {title}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label={expanded ? "Minimize" : "Maximize"}
                >
                  {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Iframe */}
            <iframe
              src={url}
              title={title}
              className="h-[calc(100%-44px)] w-full border-none bg-background"
              allow="clipboard-write"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IframeToolModal;
