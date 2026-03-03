import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import CommandCenter from "@/components/command-center/CommandCenter";

interface HansAIOverlayProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Immersive Terminal Overlay — System-Layer Grade
 *
 * Renders via portal to escape all layout containers.
 * Locks body scroll, traps focus, and creates a separate
 * visual plane that feels like entering command mode.
 */
const HansAIOverlay = ({ open, onClose }: HansAIOverlayProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const previousScroll = useRef<number>(0);
  const [isAutoFull, setIsAutoFull] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  // ── Body scroll lock + save/restore scroll & focus ──────────
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      previousScroll.current = window.scrollY;
      document.body.style.overflow = "hidden";
      // Focus the terminal container after animation settles
      requestAnimationFrame(() => {
        terminalRef.current?.focus();
      });
    } else {
      document.body.style.overflow = "";
      // Restore prior focus & scroll
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
      window.scrollTo(0, previousScroll.current);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ── Escape handler ──────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      // Focus trap: Tab cycles inside terminal
      if (e.key === "Tab" && terminalRef.current) {
        const focusable = terminalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="terminal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ isolation: "isolate" }}
          onKeyDown={handleKeyDown}
          onClick={onClose}
        >
          {/* Backdrop — deep blur + darkened, no app UI bleeds through */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            style={{
              background: isAutoFull
                ? "radial-gradient(ellipse at center, rgba(0,12,2,0.92) 0%, rgba(0,4,0,0.97) 100%)"
                : "radial-gradient(ellipse at center, rgba(5,5,12,0.88) 0%, rgba(2,2,6,0.95) 100%)",
            }}
          />

          {/* CRT scanlines — autofull only */}
          <AnimatePresence>
            {isAutoFull && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-[1]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  background: "repeating-linear-gradient(0deg, rgba(0,255,65,0.04) 0px, rgba(0,255,65,0.04) 1px, transparent 1px, transparent 3px)",
                  mixBlendMode: "overlay",
                }}
              />
            )}
          </AnimatePresence>

          {/* Vignette — autofull only */}
          <AnimatePresence>
            {isAutoFull && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-[1]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
                }}
              />
            )}
          </AnimatePresence>

          {/* Subtle ambient glow behind terminal */}
          <motion.div
            className="absolute pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              width: "min(90vw, 800px)",
              height: "70vh",
              background: isAutoFull
                ? "radial-gradient(ellipse, rgba(0,255,65,0.06) 0%, transparent 70%)"
                : "radial-gradient(ellipse, rgba(249,115,22,0.06) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />

          {/* Terminal surface — the focal plane */}
          <motion.div
            ref={terminalRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1], // custom spring-like ease
            }}
            className="relative w-full flex flex-col overflow-hidden outline-none"
            style={{
              maxWidth: "min(92vw, 760px)",
              height: "min(82vh, 720px)",
              borderRadius: 16,
              border: "1px solid rgba(249,115,22,0.15)",
              boxShadow: [
                "0 0 0 1px rgba(0,0,0,0.3)",
                "0 25px 80px -12px rgba(0,0,0,0.7)",
                "0 0 60px -20px rgba(249,115,22,0.12)",
                "inset 0 1px 0 rgba(255,255,255,0.03)",
              ].join(", "),
              background: "linear-gradient(180deg, hsl(240 10% 5.5%) 0%, hsl(240 10% 4%) 100%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top highlight line — subtle mode indicator */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent 10%, rgba(249,115,22,0.3) 50%, transparent 90%)",
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            />

            {/* Command Center fills the entire terminal */}
            <CommandCenter mode="popup" onClose={onClose} onAutoFullChange={setIsAutoFull} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Portal to document.body — escapes all layout containers; guard for SSR
  if (!isMounted) return null;
  return createPortal(overlay, document.body);
};

export default HansAIOverlay;
