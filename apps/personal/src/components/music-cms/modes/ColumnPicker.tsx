// Kolomkiezer — welke attributen zie je per versie-regel? De keuze wordt hard
// opgeslagen bij het account (user_dashboard_prefs), niet in de browser.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Columns3, Loader2 } from "lucide-react";
import { COLUMNS } from "../lib/trackColumns";

interface Props {
  visible: string[];
  saving: boolean;
  onChange: (next: string[]) => void;
}

export default function ColumnPicker({ visible, saving, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (id: string) => {
    const has = visible.includes(id);
    // volgorde van COLUMNS aanhouden, zodat de rij altijd logisch leest
    const next = has
      ? visible.filter((c) => c !== id)
      : COLUMNS.filter((c) => visible.includes(c.id) || c.id === id).map((c) => c.id);
    onChange(next);
  };

  return (
    <div className="mp-colpick" ref={ref}>
      <button
        type="button"
        className="mp-mini-btn"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        title="Kies welke attributen je ziet"
      >
        {saving ? <Loader2 size={13} className="mp-spin" aria-hidden="true" /> : <Columns3 size={13} aria-hidden="true" />}
        Kolommen ({visible.length})
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="mp-colpick-menu"
            role="group"
            aria-label="Zichtbare kolommen"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
          >
            <p className="mp-colpick-hint">Opgeslagen bij je account — blijft staan op elk apparaat.</p>
            {COLUMNS.map((c) => {
              const on = visible.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className="mp-colpick-item"
                  role="switch"
                  aria-checked={on}
                  onClick={() => toggle(c.id)}
                >
                  <span className="mp-colpick-box" data-on={on || undefined} aria-hidden="true">
                    {on && <Check size={11} />}
                  </span>
                  {c.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
