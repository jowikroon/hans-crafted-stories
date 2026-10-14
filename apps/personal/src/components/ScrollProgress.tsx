import { useEffect, useState } from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

/* ScrollProgress — thin accent bar pinned to the top of the viewport that
   fills as the page scrolls. Hidden for reduced-motion.

   Perf okt 2026 (PSI "gedwongen dynamische aanpassing"): de framer-motion
   variant hieronder gebruikt useScroll(), en die leest bij elke scroll-event
   scrollWidth, scrollHeight, clientWidth en clientHeight achter elkaar op
   hetzelfde element. Gemeten in de browser op de live pagina: 6 layout-reads
   per scroll, waarvan de helft hiervandaan en de helft uit GTM.

   Oplossing: waar de browser scroll-driven animations ondersteunt doet CSS het
   werk, volledig buiten de main thread, nul layout-reads. Alleen browsers
   zonder die support krijgen de JS-variant, en die mount pas na hydration zodat
   de meting niet meer in het kritieke pad valt. De SSR-output is in beide
   gevallen hetzelfde lege div, dus geen hydration mismatch. */

const SUPPORTS_SCROLL_TIMELINE = () =>
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("animation-timeline: scroll()");

const ScrollProgress = () => {
  const reduce = useReducedMotion();
  /* null = nog niet vastgesteld (SSR en de eerste render), zodat de markup
     identiek is aan wat de prerender uitspuugt. */
  const [needsJsFallback, setNeedsJsFallback] = useState<boolean | null>(null);

  useEffect(() => {
    setNeedsJsFallback(!SUPPORTS_SCROLL_TIMELINE());
  }, []);

  if (reduce) return null;

  /* De CSS-variant. Buiten @supports staat hij op display:none (zie
     index.css), dus in oudere browsers is hij onzichtbaar en neemt de
     JS-fallback hieronder het over. */
  return (
    <>
      <div aria-hidden="true" className="hvl-scroll-progress" />
      {needsJsFallback === true && <ScrollProgressJs />}
    </>
  );
};

/** Fallback voor browsers zonder scroll-driven animations. */
const ScrollProgressJs = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: "0%" }}
      className="fixed left-0 top-0 z-[60] h-[2px] w-full bg-primary/80"
    />
  );
};

export default ScrollProgress;
