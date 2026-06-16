import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

/* Page transition — a smooth fade with a whisper of blur on enter.
   Intentionally keeps NO y-translate and NO exit animation (preserves the
   #121 "snappier navigation / no layout shift" decision): the incoming page
   still mounts immediately. Reduced-motion users get an instant, blur-free
   fade. The tiny blur is GPU-cheap and reads as "premium" without cost to
   layout stability or LCP. */
const PageTransition = ({ children }: { children: ReactNode }) => {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(6px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
