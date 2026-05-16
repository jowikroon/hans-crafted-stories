import { useBlogPost } from "../hooks/useBlogPost";

function StatusPill({ status, published }: { status: string; published: boolean }) {
  const cls = status === "published" || published ? "live" : status === "scheduled" ? "scheduled" : status === "review" ? "review" : "draft";
  const label = status === "published" || published ? "live" : status === "review" ? "in review" : status || "draft";
  return <span className={`stage-pill ${cls}`}>{label}</span>;
}

export default function WriteMode({ postId }: { postId?: string }) {
  const state = useBlogPost(postId);

  // No post selected — empty state
  if (!postId || state.status === "idle") {
    return (
      <>
        <main className="main">
          <section className="hero">
            <div className="hero-titleblock">
              <div className="eyebrow">
                <span className="stage-pill">new</span>
              </div>
              <h1 className="h-wordmark">Schrijven<em>.</em></h1>
              <input className="title-input" type="text" placeholder="Untitled draft" readOnly />
            </div>
            <div className="hero-actions">
              <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" disabled>History</button>
              <button className="stamp-btn" disabled>Publish</button>
            </div>
          </section>
          <div className="paper" style={{ minHeight: 320, display: "grid", placeItems: "center" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Select a post from Manage or start a new draft
            </p>
          </div>
        </main>
        <aside className="rail">
          <h2 className="rail-h">Score<em>.</em></h2>
          <div className="card">
            <div className="card-head">Voice match<span>–</span></div>
            <div className="score-row"><strong>–</strong><span className="max">/100</span></div>
            <div className="gauge" style={{ "--pct": "0%" } as React.CSSProperties} />
          </div>
          <div className="card">
            <div className="card-head">Completeness<span>–</span></div>
            <div className="score-row"><strong>–</strong><span className="max">/100</span></div>
            <div className="gauge" style={{ "--pct": "0%" } as React.CSSProperties} />
          </div>
        </aside>
      </>
    );
  }

  // Loading
  if (state.status === "loading") {
    return (
      <main className="main" style={{ display: "grid", placeItems: "center", minHeight: 400 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Loading post…
        </p>
      </main>
    );
  }

  // Not found
  if (state.status === "not-found") {
    return (
      <main className="main" style={{ display: "grid", placeItems: "center", minHeight: 400 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Post not found
        </p>
      </main>
    );
  }

  // Error
  if (state.status === "error") {
    return (
      <main className="main" style={{ display: "grid", placeItems: "center", minHeight: 400 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent, #c00)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {state.message}
        </p>
      </main>
    );
  }

  // Loaded — display post data (read-only for now)
  const { post } = state;
  const voiceScore = post.voice_match_score ?? 0;
  const completenessScore = post.completeness_score ?? 0;

  return (
    <>
      <main className="main">
        <section className="hero">
          <div className="hero-titleblock">
            <div className="eyebrow">
              <StatusPill status={post.status} published={post.published} />
              <span className="sep">·</span>
              <span>{post.category}</span>
              {post.word_count != null && (
                <>
                  <span className="sep">·</span>
                  <span>{post.word_count.toLocaleString()} words</span>
                </>
              )}
            </div>
            <h1 className="h-wordmark">Schrijven<em>.</em></h1>
            <input
              className="title-input"
              type="text"
              value={post.title || ""}
              placeholder="Untitled draft"
              readOnly
            />
            {post.title_nl && (
              <input
                className="title-input"
                type="text"
                value={post.title_nl}
                placeholder="NL title"
                readOnly
                style={{ marginTop: 8, opacity: 0.7, fontSize: "0.85em" }}
              />
            )}
          </div>
          <div className="hero-actions">
            <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" disabled>History</button>
            <button className="stamp-btn" disabled>Publish</button>
          </div>
        </section>

        {/* EN content */}
        <div className="paper" style={{ minHeight: 200 }}>
          {post.content ? (
            <div
              className="prose"
              style={{ fontFamily: "var(--font-body)", lineHeight: 1.7, padding: "var(--s-4)" }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "var(--s-4)" }}>
              No EN content yet
            </p>
          )}
        </div>

        {/* NL content */}
        {post.content_nl && (
          <div className="paper" style={{ minHeight: 120, marginTop: "var(--s-3)" }}>
            <div className="eyebrow" style={{ padding: "var(--s-3) var(--s-4) 0" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-3)" }}>NL</span>
            </div>
            <div
              className="prose"
              style={{ fontFamily: "var(--font-body)", lineHeight: 1.7, padding: "var(--s-4)" }}
              dangerouslySetInnerHTML={{ __html: post.content_nl }}
            />
          </div>
        )}
      </main>

      <aside className="rail">
        <h2 className="rail-h">Score<em>.</em></h2>
        <div className="card">
          <div className="card-head">Voice match<span>{voiceScore > 0 ? `${voiceScore}%` : "–"}</span></div>
          <div className="score-row">
            <strong>{voiceScore > 0 ? voiceScore : "–"}</strong>
            <span className="max">/100</span>
          </div>
          <div className="gauge" style={{ "--pct": `${voiceScore}%` } as React.CSSProperties} />
        </div>
        <div className="card">
          <div className="card-head">Completeness<span>{completenessScore > 0 ? `${completenessScore}%` : "–"}</span></div>
          <div className="score-row">
            <strong>{completenessScore > 0 ? completenessScore : "–"}</strong>
            <span className="max">/100</span>
          </div>
          <div className="gauge" style={{ "--pct": `${completenessScore}%` } as React.CSSProperties} />
        </div>
        {post.meta_title && (
          <div className="card">
            <div className="card-head">SEO<span></span></div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-1)", lineHeight: 1.5, margin: 0 }}>
              {post.meta_title}
            </p>
            {post.meta_description && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-2)", lineHeight: 1.5, marginTop: 6 }}>
                {post.meta_description}
              </p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
