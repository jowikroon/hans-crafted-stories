import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Filter } from "lucide-react";
import type { ContextCategory } from "./contextCategories";

interface ContextFilterPillsProps {
  categories: ContextCategory[];
  selectedCategory: string | null;
  selectedSub: string | null;
  onSelect: (categoryId: string | null, subId: string | null) => void;
  accentColor: "emerald" | "violet" | "orange";
}

const colorMap = {
  emerald: {
    trigger: "border-emerald-500/20 text-emerald-400/60 hover:border-emerald-500/40 hover:text-emerald-300",
    triggerActive: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    pill: "border-emerald-500/15 text-emerald-400/50 hover:border-emerald-500/30 hover:text-emerald-300",
    active: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    sub: "border-emerald-500/10 text-emerald-400/40 hover:border-emerald-500/25 hover:text-emerald-300",
    subActive: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    divider: "border-emerald-500/10",
    dropdown: "border-emerald-500/20 bg-[#0A0F0A]",
    heading: "text-emerald-500/40",
  },
  violet: {
    trigger: "border-violet-500/20 text-violet-400/60 hover:border-violet-500/40 hover:text-violet-300",
    triggerActive: "border-violet-400/40 bg-violet-500/10 text-violet-300",
    pill: "border-violet-500/15 text-violet-400/50 hover:border-violet-500/30 hover:text-violet-300",
    active: "border-violet-400/40 bg-violet-500/10 text-violet-300",
    sub: "border-violet-500/10 text-violet-400/40 hover:border-violet-500/25 hover:text-violet-300",
    subActive: "border-violet-400/30 bg-violet-500/10 text-violet-300",
    divider: "border-violet-500/10",
    dropdown: "border-violet-500/20 bg-[#0A0F0A]",
    heading: "text-violet-500/40",
  },
  orange: {
    trigger: "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
    triggerActive: "border-orange-400/40 bg-orange-500/10 text-orange-300",
    pill: "border-orange-500/15 text-orange-400/50 hover:border-orange-500/30 hover:text-orange-300",
    active: "border-orange-400/40 bg-orange-500/10 text-orange-300",
    sub: "border-orange-500/10 text-orange-400/40 hover:border-orange-500/25 hover:text-orange-300",
    subActive: "border-orange-400/30 bg-orange-500/10 text-orange-300",
    divider: "border-orange-500/10",
    dropdown: "border-border bg-card",
    heading: "text-muted-foreground/40",
  },
};

const ContextFilterPills = ({ categories, selectedCategory, selectedSub, onSelect, accentColor }: ContextFilterPillsProps) => {
  const colors = colorMap[accentColor];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeCat = categories.find(c => c.id === selectedCategory);
  const activeSub = activeCat?.subcategories.find(s => s.id === selectedSub);

  // Build summarized label
  const label = activeCat
    ? activeSub
      ? `${activeCat.label} › ${activeSub.label}`
      : activeCat.label
    : "All Contexts";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all ${
          selectedCategory ? colors.triggerActive : colors.trigger
        }`}
      >
        <Filter size={10} />
        <span className="max-w-[120px] truncate">{label}</span>
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className={`absolute left-0 top-full z-[200] mt-1.5 w-64 max-h-80 overflow-y-auto rounded-xl border p-2 shadow-xl ${colors.dropdown}`}
          >
            {/* All option */}
            <button
              onClick={() => { onSelect(null, null); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium transition-all ${
                !selectedCategory ? colors.active : colors.pill
              }`}
            >
              All Contexts
            </button>

            <div className={`my-1.5 h-px ${colors.divider}`} />

            {/* Categories with inline subcategories */}
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isCatActive = selectedCategory === cat.id;
              return (
                <div key={cat.id} className="mb-0.5">
                  <button
                    onClick={() => {
                      onSelect(isCatActive ? null : cat.id, null);
                      if (isCatActive) setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                      isCatActive ? colors.active : colors.pill
                    }`}
                  >
                    <Icon size={11} />
                    {cat.label}
                  </button>

                  {/* Subcategories — shown when category is active */}
                  <AnimatePresence>
                    {isCatActive && cat.subcategories.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="overflow-hidden pl-5"
                      >
                        {cat.subcategories.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              onSelect(selectedCategory, selectedSub === sub.id ? null : sub.id);
                              setOpen(false);
                            }}
                            className={`flex w-full items-center rounded-md px-2 py-1 text-[10px] font-medium transition-all ${
                              selectedSub === sub.id ? colors.subActive : colors.sub
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContextFilterPills;