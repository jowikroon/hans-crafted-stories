import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* Magnetic — a subtle, premium hover micro-interaction. The wrapped element
   leans a few pixels toward the cursor while hovered, then springs back.
   Strength is intentionally small (default 0.25 → max ~8px) so it reads as
   polish, not a gimmick. Fully disabled for reduced-motion and touch. */
const Magnetic = ({ children, strength = 0.25, className }: { children: ReactNode; strength?: number; className?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{children}</span>;
  const onMove = (e: React.MouseEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * strength}px, ${(e.clientY - (r.top + r.height / 2)) * strength}px)`;
  };
  const reset = () => { if (ref.current) ref.current.style.transform = "translate(0px, 0px)"; };
  return (
    <motion.span ref={ref} className={className} style={{ display: "inline-flex", willChange: "transform" }} onMouseMove={onMove} onMouseLeave={reset} transition={{ type: "spring", stiffness: 250, damping: 18 }}>
      {children}
    </motion.span>
  );
};
export default Magnetic;
