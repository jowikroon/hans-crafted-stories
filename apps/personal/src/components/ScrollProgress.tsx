import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

/* ScrollProgress — a thin accent bar pinned to the top of the viewport that
   fills as the page scrolls. Spring-smoothed for a fluid feel. Hidden for
   reduced-motion users (it is decorative). Sits above content, below modals. */
const ScrollProgress = () => {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: "0%" }}
      className="fixed left-0 top-0 z-[60] h-[2px] w-full bg-primary/80"
    />
  );
};

export default ScrollProgress;
