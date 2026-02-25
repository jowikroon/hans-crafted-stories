import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const PremiumToggle = ({ checked, onCheckedChange, disabled }: PremiumToggleProps) => {
  const [animating, setAnimating] = useState(false);
  const [progress, setProgress] = useState(checked ? 100 : 0);

  useEffect(() => {
    if (animating) {
      const target = checked ? 100 : 0;
      const start = checked ? 0 : 100;
      const duration = 400;
      const startTime = Date.now();

      const tick = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setProgress(start + (target - start) * eased);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          setAnimating(false);
        }
      };
      requestAnimationFrame(tick);
    }
  }, [animating, checked]);

  const handleClick = () => {
    if (disabled) return;
    setAnimating(true);
    onCheckedChange(!checked);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full 
        border-2 transition-all duration-300
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked 
          ? "border-emerald-500/40 bg-emerald-500/10" 
          : "border-border bg-muted/40"
        }
      `}
      role="switch"
      aria-checked={checked}
    >
      {/* Progress bar track */}
      <div className="absolute inset-[3px] overflow-hidden rounded-full">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${progress}%`,
            background: checked
              ? "linear-gradient(90deg, hsl(var(--primary) / 0.15), hsl(152 60% 50% / 0.25))"
              : "hsl(var(--muted))",
          }}
          transition={{ duration: 0.05 }}
        />
      </div>

      {/* Thumb */}
      <motion.div
        layout
        className={`
          relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md
          ${checked
            ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30"
            : "bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/40 shadow-foreground/5"
          }
        `}
        animate={{
          x: checked ? 24 : 2,
          scale: animating ? 0.85 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.8,
        }}
      >
        {/* Inner dot indicator */}
        <AnimatePresence mode="wait">
          {checked ? (
            <motion.div
              key="on"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-2 w-2 rounded-full bg-white/90"
            />
          ) : (
            <motion.div
              key="off"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-1.5 w-1.5 rounded-full bg-foreground/30"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Ripple effect on toggle */}
      <AnimatePresence>
        {animating && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0.4 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`absolute rounded-full ${
              checked ? "bg-emerald-400" : "bg-muted-foreground"
            }`}
            style={{
              width: 24,
              height: 24,
              left: checked ? 26 : 4,
              top: 2,
            }}
          />
        )}
      </AnimatePresence>
    </button>
  );
};

export default PremiumToggle;
