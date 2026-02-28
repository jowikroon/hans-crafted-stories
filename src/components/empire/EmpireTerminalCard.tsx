import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, X, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { usePageElements } from "@/hooks/usePageElements";

const TERMINAL_URL = "https://terminal.hansvanleeuwen.com";

const EmpireTerminalCard = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { isVisible } = usePageElements("portal");
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);

  if (!user || !isAdmin || !isVisible("terminal_button")) return null;

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-[hsl(220,20%,8%)] shadow-lg shadow-emerald-500/10 transition-all hover:border-emerald-500/50 hover:shadow-emerald-500/20"
            title="Open Claude Terminal"
          >
            <Terminal size={20} className="text-emerald-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Terminal panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed z-50 overflow-hidden rounded-xl border border-emerald-500/20 bg-[hsl(220,20%,6%)] shadow-2xl shadow-black/50 ${
              maximized
                ? "inset-3"
                : "bottom-6 right-6 h-[500px] w-[600px] max-w-[calc(100vw-3rem)]"
            }`}
          >
            {/* Title bar */}
            <div className="flex items-center justify-between border-b border-emerald-500/10 bg-[hsl(220,18%,10%)] px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <span className="ml-2 font-mono text-[11px] text-emerald-400/60">
                  claude@srv1402218 — /opt/hansai
                </span>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={TERMINAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 text-emerald-400/40 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300"
                  title="Open in new tab"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  onClick={() => setMaximized(!maximized)}
                  className="rounded p-1 text-emerald-400/40 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300"
                  title={maximized ? "Restore" : "Maximize"}
                >
                  {maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <button
                  onClick={() => { setOpen(false); setMaximized(false); }}
                  className="rounded p-1 text-emerald-400/40 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300"
                  title="Close"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Terminal iframe */}
            <iframe
              src={TERMINAL_URL}
              className="h-[calc(100%-36px)] w-full border-0 bg-black"
              allow="clipboard-read; clipboard-write"
              title="Claude Terminal"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmpireTerminalCard;