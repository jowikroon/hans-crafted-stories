import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * SamanthaGlobalButton — Floating access to Samantha from any page.
 * Hidden when already on /samantha. Toggles with ⌘J / Ctrl+J.
 * Renders at app root level.
 */
export default function SamanthaGlobalButton() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  // Hide on /samantha — user is already in the full experience
  const onSamantha = location.pathname === "/samantha";

  // ⌘J / Ctrl+J shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        navigate("/samantha");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigate]);

  // Don't show if not logged in or already on Samantha
  if (!user || onSamantha) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate("/samantha")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-br from-rose-500/90 to-amber-500/90 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-shadow"
      style={{ padding: hovered ? "12px 20px" : "14px" }}
      aria-label="Open Samantha"
    >
      <MessageCircle size={20} className="text-white" />
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="text-sm font-medium text-white whitespace-nowrap overflow-hidden"
          >
            Samantha
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
