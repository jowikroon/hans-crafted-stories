import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CommandCenter from "@/components/command-center/CommandCenter";

interface HansAIOverlayProps {
  open: boolean;
  onClose: () => void;
}

const HansAIOverlay = ({ open, onClose }: HansAIOverlayProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
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
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl mx-4 flex flex-col rounded-2xl border-2 border-orange-500/40 bg-card shadow-2xl shadow-orange-500/10 overflow-hidden"
            style={{ height: "70vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <CommandCenter mode="popup" onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HansAIOverlay;
