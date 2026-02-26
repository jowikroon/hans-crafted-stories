import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    pill: "border-emerald-500/15 text-emerald-400/50 hover:border-emerald-500/30 hover:text-emerald-300",
    active: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    sub: "border-emerald-500/10 text-emerald-400/40 hover:border-emerald-500/25 hover:text-emerald-300",
    subActive: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    divider: "border-emerald-500/10",
  },
  violet: {
    pill: "border-violet-500/15 text-violet-400/50 hover:border-violet-500/30 hover:text-violet-300",
    active: "border-violet-400/40 bg-violet-500/10 text-violet-300",
    sub: "border-violet-500/10 text-violet-400/40 hover:border-violet-500/25 hover:text-violet-300",
    subActive: "border-violet-400/30 bg-violet-500/10 text-violet-300",
    divider: "border-violet-500/10",
  },
  orange: {
    pill: "border-orange-500/15 text-orange-400/50 hover:border-orange-500/30 hover:text-orange-300",
    active: "border-orange-400/40 bg-orange-500/10 text-orange-300",
    sub: "border-orange-500/10 text-orange-400/40 hover:border-orange-500/25 hover:text-orange-300",
    subActive: "border-orange-400/30 bg-orange-500/10 text-orange-300",
    divider: "border-orange-500/10",
  },
};

const ContextFilterPills = ({ categories, selectedCategory, selectedSub, onSelect, accentColor }: ContextFilterPillsProps) => {
  const colors = colorMap[accentColor];
  const activeCat = categories.find(c => c.id === selectedCategory);

  return (
    <div className={`border-b ${colors.divider}`}>
      {/* Layer 1 — Categories */}
      <div className="flex items-center gap-1 overflow-x-auto px-3 py-1.5 scrollbar-none">
        <button
          onClick={() => onSelect(null, null)}
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-all ${
            !selectedCategory ? colors.active : colors.pill
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(isActive ? null : cat.id, null)}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-all ${
                isActive ? colors.active : colors.pill
              }`}
            >
              <Icon size={9} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Layer 2 — Subcategories */}
      <AnimatePresence>
        {activeCat && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-1 overflow-x-auto px-3 pb-1.5 scrollbar-none">
              {activeCat.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => onSelect(selectedCategory, selectedSub === sub.id ? null : sub.id)}
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-medium transition-all ${
                    selectedSub === sub.id ? colors.subActive : colors.sub
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContextFilterPills;
