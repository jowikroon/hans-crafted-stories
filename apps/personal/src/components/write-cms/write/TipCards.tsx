import { useState } from "react";

// ─── Rijke writing-tip cards (design contract A6) ────────────────────────────
// Vervangt de platte tip-lijst. Elke tip is een card met tag + impact, headline,
// suggestie, een uitklapbare "why" met stat, en acties apply/later/learn.

export interface RichTip {
  category: "tone" | "seo" | "linking" | "factcheck";
  headline: string;
  suggestion: string;
  why: string;
  stat?: string;
  impact: string;
}

const CAT_LABEL: Record<RichTip["category"], string> = {
  tone: "Toon",
  seo: "SEO",
  linking: "Linking",
  factcheck: "Factcheck",
};

/** Bouw rijke tips uit de platte content_rules-tips van het voice template. */
export function buildRichTips(plain: string[]): RichTip[] {
  const cats: RichTip["category"][] = ["tone", "seo", "linking", "factcheck"];
  return plain.slice(0, 4).map((t, i) => ({
    category: cats[i % cats.length],
    headline: t.length > 60 ? t.slice(0, 58) + "…" : t,
    suggestion: t,
    why: "Deze regel komt uit je voice template, consistent toepassen houdt je stem herkenbaar.",
    stat: i === 0 ? "Voice-consistentie weegt het zwaarst voor merkherkenning" : undefined,
    impact: ["+toon", "+vindbaarheid", "+autoriteit", "+vertrouwen"][i % 4],
  }));
}

export default function TipCards({ tips }: { tips: RichTip[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visible = tips.filter((_, i) => !dismissed.has(i));
  if (!visible.length) return null;

  return (
    <div className="card tips-card">
      <div className="card-head">Writing tips<span>{visible.length}</span></div>
      <div className="tips-stack">
        {tips.map((tip, i) => {
          if (dismissed.has(i)) return null;
          const isOpen = open === i;
          return (
            <div key={i} className={`tip-card tip-${tip.category}`}>
              <div className="tip-row">
                <span className="tip-tag">{CAT_LABEL[tip.category]}</span>
                <span className="tip-impact">{tip.impact}</span>
              </div>
              <button className="tip-headline" onClick={() => setOpen(isOpen ? null : i)}>
                {tip.headline}
                <span className="tip-chevron">{isOpen ? "▾" : "▸"}</span>
              </button>
              {isOpen && (
                <div className="tip-why">
                  <div className="tip-suggestion">{tip.suggestion}</div>
                  <div className="tip-why-body">{tip.why}</div>
                  {tip.stat && <div className="tip-why-stat">{tip.stat}</div>}
                  <div className="tip-actions">
                    <button className="tip-apply" onClick={() => setDismissed((d) => new Set(d).add(i))}>✓ Toegepast</button>
                    <button className="tip-later" onClick={() => setOpen(null)}>Later</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
