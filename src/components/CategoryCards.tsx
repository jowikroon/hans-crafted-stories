import { motion } from "framer-motion";
import { LayoutGrid, Briefcase, Heart, Star, Zap, BookOpen, Code, Palette } from "lucide-react";
import type { CategoryCardRow } from "@/hooks/useCategoryCards";

const iconMap: Record<string, React.ReactNode> = {
  LayoutGrid: <LayoutGrid size={18} />,
  Briefcase: <Briefcase size={18} />,
  Heart: <Heart size={18} />,
  Star: <Star size={18} />,
  Zap: <Zap size={18} />,
  BookOpen: <BookOpen size={18} />,
  Code: <Code size={18} />,
  Palette: <Palette size={18} />,
};

interface CategoryCardsProps {
  cards: CategoryCardRow[];
  activeValue: string;
  getCount: (value: string) => number;
  onSelect: (value: string) => void;
}

const CategoryCards = ({ cards, activeValue, getCount, onSelect }: CategoryCardsProps) => {
  if (cards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`mb-8 grid gap-3 grid-cols-2 ${cards.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}
    >
      {cards.map((card, i) => {
        const isActive = activeValue === card.value;
        const count = getCount(card.value);

        const baseClasses = `from-${card.color_from} to-${card.color_to} ${card.text_color} ${card.border_color} hover:${card.border_color.replace("/15", "/30")}`;
        const activeClasses = `from-${card.active_color_from} to-${card.active_color_to} ${card.text_color} ${card.active_border_color} shadow-md`;

        return (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 + i * 0.06 }}
            onClick={() => onSelect(card.value)}
            className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 text-left transition-all duration-300 ${
              isActive ? activeClasses : baseClasses
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                {iconMap[card.icon] ?? <LayoutGrid size={18} />}
              </div>
              <span
                className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                  isActive ? "bg-background/80 shadow-sm" : "bg-background/40"
                }`}
              >
                {count}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold">{card.label}</p>
            <p className="mt-0.5 text-[11px] opacity-60">{card.description}</p>
            {isActive && (
              <motion.div
                layoutId="categoryIndicator"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-current opacity-40"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default CategoryCards;
