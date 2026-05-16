// WriteMode — stub for Phase 1.
// Full editor (EN/NL split paper, autosave, voice analysis) added in Phase 2.
export default function WriteMode() {
  return (
    <>
      <main className="main">
        <section className="hero">
          <div className="hero-titleblock">
            <div className="eyebrow">
              <span className="stage-pill">draft</span>
              <span className="sep">·</span>
              <span>Phase 2 — editor coming next</span>
            </div>
            <h1 className="h-wordmark">Schrijven<em>.</em></h1>
            <input
              className="title-input"
              type="text"
              placeholder="Untitled draft"
              readOnly
            />
          </div>
          <div className="hero-actions">
            <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" disabled>
              History
            </button>
            <button className="stamp-btn" disabled>
              Publish
            </button>
          </div>
        </section>

        <div className="paper" style={{ minHeight: 320, display: "grid", placeItems: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Editor wiring — Phase 2
          </p>
        </div>
      </main>

      <aside className="rail">
        <h2 className="rail-h">Score<em>.</em></h2>
        <div className="card">
          <div className="card-head">Voice match<span>–</span></div>
          <div className="score-row">
            <strong>–</strong>
            <span className="max">/100</span>
          </div>
          <div className="gauge" style={{ "--pct": "0%" } as React.CSSProperties} />
        </div>
        <div className="card">
          <div className="card-head">Completeness<span>–</span></div>
          <div className="score-row">
            <strong>–</strong>
            <span className="max">/100</span>
          </div>
          <div className="gauge" style={{ "--pct": "0%" } as React.CSSProperties} />
        </div>
      </aside>
    </>
  );
}
