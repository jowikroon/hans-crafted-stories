import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Command } from "lucide-react";
import UnifiedChatPanel from "@/components/portal/UnifiedChatPanel";

interface HansAIOverlayProps {
  open: boolean;
  onClose: () => void;
}

const HansAIOverlay = ({ open, onClose }: HansAIOverlayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl mx-4 flex flex-col rounded-2xl border-2 border-orange-500/40 bg-card shadow-2xl shadow-orange-500/10 overflow-hidden"
            style={{ height: "100vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Overlay header — close button + link to full terminal */}
            <div className="flex items-center justify-between border-b border-orange-500/15 px-4 py-2.5 bg-card/80">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10">
                  <Command size={12} className="text-orange-400" />
                </div>
                <span className="text-[11px] font-semibold text-foreground">Command Center</span>
                <span className="text-[9px] text-muted-foreground/50">· Intent · Workflows · AI</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/hansai"
                  className="rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
                >
                  Full Terminal →
                </a>
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Intent-first Command Center panel */}
            <div className="flex-1 min-h-0">
              <UnifiedChatPanel />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HansAIOverlay;
