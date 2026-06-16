import { motion, useReducedMotion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

/* Reveal — soft scroll-reveal used across the marketing site.
   A fade + gentle rise that fires once when the element enters the
   viewport. Honors prefers-reduced-motion: content appears instantly
   with no transform when the user has opted out. */

const EASE = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "article" | "span";
  className?: string;
  margin?: string;
}

export const Reveal = ({
  children,
  delay = 0,
  y = 18,
  as = "div",
  className,
  margin = "-60px",
}: RevealProps) => {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  if (reduce) {
    const Tag = as as "div";
    return <Tag className={className}>{children}</Tag>;
  }
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
};

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const RevealGroup = ({
  children,
  className,
  margin = "-60px",
}: {
  children: ReactNode;
  className?: string;
  margin?: string;
}) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin }}
    >
      {children}
    </motion.div>
  );
};

export const RevealItem = ({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) => {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  if (reduce) {
    const Tag = as as "div";
    return <Tag className={className}>{children}</Tag>;
  }
  return (
    <MotionTag className={className} variants={itemVariants}>
      {children}
    </MotionTag>
  );
};

export default Reveal;
