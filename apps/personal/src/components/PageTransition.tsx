import { motion } from "framer-motion";
import { ReactNode } from "react";

// Opacity-only fade-in, no exit animation. Removing the exit (and the
// `mode="wait"` on AnimatePresence) means the incoming page mounts
// immediately instead of waiting for the previous page to animate out.
// No y-translate so there is no layout shift on navigation.
const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.18, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export default PageTransition;
