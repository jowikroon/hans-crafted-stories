import { useRef, useState, useCallback } from "react";

// ─── Idea bubble — draggable writing-coach card (design contract #12) ─────────
// Page-session only: dismiss hides it until the next visit. Refresh cycles
// through 9 categorized ideas; "Insert note" drops the tip into the EN draft
// as a markdown blockquote so it survives the markdown round-trip.

interface Idea {
  tag: string;
  what: string;
  /** Markdown snippet inserted into the draft when applied. */
  md: string;
}

const IDEAS: Idea[] = [
  { tag: "impact", what: "Open with a one-sentence claim before the intro. Readers decide in 8 seconds, lead with the take, not the setup.", md: "> 💡 **Impact:** verplaats je sterkste zin naar alinea 1, open met de claim, niet met de aanloop." },
  { tag: "design", what: "Add a comparison table, readers scan, and tables get screenshotted.", md: "> 💡 **Design:** voeg hier een vergelijkingstabel toe (aanpak · faalmodus · fix · impact)." },
  { tag: "closure", what: "End with a callback to your opening metaphor, strong closure beats a generic CTA.", md: "> 💡 **Slot:** sluit af met een callback naar je openingsmetafoor in plaats van een generieke CTA." },
  { tag: "skimmers", what: "Numbered list at the top for skimmers, \"if you only read one bullet, read #2\".", md: "> 💡 **Skimmers:** zet bovenaan een genummerde lijst met de 3-4 kernpunten." },
  { tag: "authenticity", what: "Drop in one dated observation from your own work. \"Q2 2026, drie Bol.com accounts\" beats \"recent trends\", specificity reads as real.", md: "> 💡 **Authenticiteit:** voeg één gedateerde observatie uit eigen werk toe (bv. \"Q2 2026, drie Bol.com accounts...\")." },
  { tag: "readability", what: "Break the longest paragraph into three. Readers bail after line 5 of any single block.", md: "> 💡 **Leesbaarheid:** splits de langste alinea in drieën, max ±3 regels per blok." },
  { tag: "design", what: "Add a pull-quote between sections. Pull-quotes triple time-on-page and are the most-screenshotted element on technical blogs.", md: "> 💡 **Pull-quote:** til je scherpste zin uit de tekst en zet hem als quote tussen twee secties." },
  { tag: "e-e-a-t", what: "Found a claim with a number? Add the source inline. E-E-A-T scores ~20% higher with cited sources.", md: "> 💡 **E-E-A-T:** check claims met cijfers en zet de bron er inline bij." },
  { tag: "voice", what: "Read the draft out loud once. Anything you would never say to a client gets rewritten in your own words.", md: "> 💡 **Voice:** lees hardop, alles wat je nooit tegen een klant zou zeggen, herschrijven." },
];

export default function IdeaBubble({ onInsert }: { onInsert: (md: string) => void }) {
  const [visible, setVisible] = useState(true);
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * IDEAS.length));
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
  }, [dragging]);

  const onPointerUp = useCallback(() => setDragging(false), []);

  if (!visible) return null;
  const idea = IDEAS[idx % IDEAS.length];

  return (
    <div
      ref={ref}
      className={`idea-bubble${dragging ? " dragging" : ""}`}
      style={pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="head">
        <span className="lab">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5a4.5 4.5 0 00-2.5 8.25V12a1 1 0 001 1h3a1 1 0 001-1v-2.25A4.5 4.5 0 008 1.5z" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M6.5 14.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Idea · {idea.tag}
        </span>
        <span className="head-actions">
          <button title="Next idea" onClick={() => setIdx((i) => i + 1)}>↻</button>
          <button title="Insert as draft note" onClick={() => onInsert(idea.md)}>+ note</button>
          <button className="close" title="Hide for this session" onClick={() => setVisible(false)}>×</button>
        </span>
      </div>
      <p className="idea-text">{idea.what}</p>
    </div>
  );
}
