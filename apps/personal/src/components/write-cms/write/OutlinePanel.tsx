import { extractOutline } from "./markdown";

// ─── Outline panel — heading map of the EN draft (design contract: rail card) ──
// Click scrolls the corresponding heading in the editor into view.

export default function OutlinePanel({ markdown, editorSelector }: { markdown: string; editorSelector: string }) {
  const outline = extractOutline(markdown);
  if (!outline.length) return null;

  const jump = (index: number) => {
    const headings = document.querySelectorAll(`${editorSelector} h2, ${editorSelector} h3`);
    const el = headings[index];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("outline-flash");
      setTimeout(() => el.classList.remove("outline-flash"), 1200);
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        Outline<span>{outline.length}</span>
      </div>
      <ul className="outline-list">
        {outline.map((h) => (
          <li key={`${h.index}-${h.text}`} className={`outline-item outline-item--h${h.level}`}>
            <button onClick={() => jump(h.index)} title="Jump to section">
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
