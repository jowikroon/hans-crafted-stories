import { useState, useRef, useCallback, useEffect } from "react";

// ─── Score-cards + suggestion-drawer + score-animaties (design contract A3/A4/A5)
// Three clickable gauges (Voice / SEO / Readability). Clicking opens a drawer with
// concrete fixes for that dimension; applying a fix runs the full animation chain:
// count-up (rollNumber), gauge flash, card bump, spark burst, and a "+N" delta toast.

type Dim = "voice" | "seo" | "readability";

interface Suggestion { what: string; why: string; delta: number }

const DIM_META: Record<Dim, { label: string; color: string }> = {
  voice: { label: "Sounds like you", color: "var(--live, #1d7f4e)" },
  seo: { label: "Will people find it", color: "var(--accent, #b8860b)" },
  readability: { label: "Easy to read", color: "var(--scheduled, #2a6ea8)" },
};

const SUGGESTIONS: Record<Dim, Suggestion[]> = {
  voice: [
    { what: "Open met een persoonlijke observatie i.p.v. een algemene claim", why: "Je calibratiezin landt sterker als eerste alinea — anti-AI-detectie hefboom #1", delta: 4 },
    { what: "Vervang 2 generieke werkwoorden door je signature phrases", why: "Herkenbaarheid: lezers herkennen je stem aan terugkerende formuleringen", delta: 3 },
    { what: "Voeg één gedateerde ervaring uit eigen werk toe", why: "Specificiteit (\"Q2 2026, drie Bol-accounts\") leest als echt, niet als AI", delta: 5 },
    { what: "Schrap één banned word dat nog in de tekst staat", why: "Banned words zijn de zichtbare brand-fingerprint van je voice", delta: 2 },
    { what: "Maak de slotzin declaratief en kort", why: "Sterke closure beats een generieke CTA", delta: 3 },
  ],
  seo: [
    { what: "Zet het primaire keyword in de eerste 100 woorden", why: "Vroege keyword-plaatsing weegt zwaarder voor relevantie", delta: 5 },
    { what: "Voeg 1 interne link naar een verwant artikel toe", why: "Interne links verspreiden autoriteit en houden lezers op de site", delta: 3 },
    { what: "Verkort de meta-titel naar 50-60 tekens", why: "Te lange titels worden afgekapt in de SERP", delta: 2 },
    { what: "Voeg een H2 met een vraag toe (FAQ-kans)", why: "Vraag-koppen winnen featured snippets en AI-antwoorden", delta: 4 },
    { what: "Voeg alt-tekst toe aan de hero-image", why: "Beeld-SEO + toegankelijkheid", delta: 2 },
  ],
  readability: [
    { what: "Splits de langste alinea in drieën", why: "Lezers haken af na regel 5 van een blok", delta: 3 },
    { what: "Wissel zinslengte af: kort. Dan lang.", why: "Burstiness maakt tekst menselijker en prettiger leesbaar", delta: 4 },
    { what: "Voeg een pull-quote tussen twee secties toe", why: "Pull-quotes verdrievoudigen time-on-page", delta: 3 },
    { what: "Vervang vakjargon door een alledaags equivalent waar kan", why: "Lagere leesdrempel = breder publiek", delta: 2 },
    { what: "Maak van een opsomming een genummerde lijst", why: "Scanbaarheid voor lezers die skimmen", delta: 2 },
  ],
};

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }

export default function ScoreCards({
  voice,
  seo,
  readability,
}: {
  voice: number;
  seo: number;
  readability: number;
}) {
  // Local optimistic scores so the apply-animations have something to move.
  const [scores, setScores] = useState<Record<Dim, number>>({ voice, seo, readability });
  useEffect(() => { setScores({ voice, seo, readability }); }, [voice, seo, readability]);

  const [openDim, setOpenDim] = useState<Dim | null>(null);
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const cardRefs = useRef<Record<Dim, HTMLDivElement | null>>({ voice: null, seo: null, readability: null });
  const numRefs = useRef<Record<Dim, HTMLElement | null>>({ voice: null, seo: null, readability: null });

  const rollNumber = useCallback((dim: Dim, from: number, to: number) => {
    const el = numRefs.current[dim];
    if (!el) { setScores((s) => ({ ...s, [dim]: to })); return; }
    el.textContent = String(from);
    const t0 = performance.now();
    const dur = 800;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const v = Math.round(from + (to - from) * easeOutCubic(p));
      el.textContent = String(v);
      if (p < 1) requestAnimationFrame(step);
      else setScores((s) => ({ ...s, [dim]: to }));
    };
    requestAnimationFrame(step);
  }, []);

  const sparkBurst = useCallback((dim: Dim) => {
    const card = cardRefs.current[dim];
    if (!card) return;
    const host = card.querySelector(".gauge") as HTMLElement | null;
    if (!host) return;
    for (let i = 0; i < 8; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      const ang = (i / 8) * Math.PI * 2;
      s.style.setProperty("--dx", `${Math.cos(ang) * 26}px`);
      s.style.setProperty("--dy", `${Math.sin(ang) * 26}px`);
      host.appendChild(s);
      setTimeout(() => s.remove(), 820);
    }
  }, []);

  const deltaToast = useCallback((dim: Dim, delta: number) => {
    const card = cardRefs.current[dim];
    if (!card) return;
    const t = document.createElement("div");
    t.className = `delta-toast ${delta >= 0 ? "up" : "down"}`;
    t.textContent = `${delta >= 0 ? "+" : ""}${delta}`;
    card.appendChild(t);
    setTimeout(() => t.remove(), 1500);
  }, []);

  const applyFix = useCallback((dim: Dim, idx: number, delta: number) => {
    const key = `${dim}-${idx}`;
    if (applied[key]) return;
    setApplied((a) => ({ ...a, [key]: true }));
    const from = scores[dim];
    const to = Math.min(100, from + delta);
    rollNumber(dim, from, to);
    const card = cardRefs.current[dim];
    const gauge = card?.querySelector(".gauge") as HTMLElement | null;
    card?.classList.add("bump");
    gauge?.classList.add("flash");
    if (gauge) gauge.style.setProperty("--pct", `${to}%`);
    sparkBurst(dim);
    deltaToast(dim, delta);
    setTimeout(() => { card?.classList.remove("bump"); gauge?.classList.remove("flash"); }, 1250);
  }, [applied, scores, rollNumber, sparkBurst, deltaToast]);

  const renderCard = (dim: Dim) => {
    const meta = DIM_META[dim];
    const val = scores[dim];
    return (
      <div
        className="card score-card"
        ref={(el) => { cardRefs.current[dim] = el; }}
        role="button"
        tabIndex={0}
        onClick={() => setOpenDim(dim)}
        onKeyDown={(e) => { if (e.key === "Enter") setOpenDim(dim); }}
        style={{ cursor: "pointer" }}
      >
        <div className="card-head">{meta.label}<span>{val > 0 ? `${val}%` : "–"}</span></div>
        <div className="score-row">
          <strong ref={(el) => { numRefs.current[dim] = el; }}>{val > 0 ? val : "–"}</strong>
          <span className="max">/100</span>
        </div>
        <div className="gauge" style={{ "--pct": `${val}%`, "--gauge-color": meta.color } as React.CSSProperties} />
        <div className="score-sub">{val >= 80 ? "✓ sterk" : val >= 60 ? "⚠ kan beter" : "↑ open punten"} · klik voor fixes</div>
      </div>
    );
  };

  const dimSugs = openDim ? SUGGESTIONS[openDim] : [];
  const appliedCount = openDim ? dimSugs.filter((_, i) => applied[`${openDim}-${i}`]).length : 0;

  return (
    <>
      {renderCard("voice")}
      {renderCard("seo")}
      {renderCard("readability")}

      {/* Suggestion drawer */}
      {openDim && (
        <>
          <div className="sug-scrim" onClick={() => setOpenDim(null)} />
          <aside className="sug-drawer">
            <div className="sug-head">
              <button className="sug-close" onClick={() => setOpenDim(null)}>×</button>
              <div className="sug-lab" style={{ color: DIM_META[openDim].color }}>{DIM_META[openDim].label}</div>
              <div className="sug-big">{scores[openDim]}<span>/100</span></div>
              <div className="gauge" style={{ "--pct": `${scores[openDim]}%`, "--gauge-color": DIM_META[openDim].color } as React.CSSProperties} />
            </div>
            <div className="sug-body">
              {dimSugs.map((s, i) => {
                const done = applied[`${openDim}-${i}`];
                return (
                  <div key={i} className={`sug-item${done ? " done" : ""}`}>
                    <div className="sug-what">{s.what}</div>
                    <div className="sug-why">{s.why}</div>
                    <button className="sug-apply" disabled={done} onClick={() => applyFix(openDim, i, s.delta)}>
                      {done ? "✓ toegepast" : <>Apply <span className="sug-pts">+{s.delta}</span></>}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="sug-foot">
              <span>{appliedCount} of {dimSugs.length} applied</span>
              <button
                className="sug-apply-all"
                onClick={() => dimSugs.forEach((s, i) => applyFix(openDim, i, s.delta))}
              >
                Apply all
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
