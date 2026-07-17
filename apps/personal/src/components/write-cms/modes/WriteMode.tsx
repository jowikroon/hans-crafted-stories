import { useState, useEffect } from "react";
import { useBlogPost } from "../hooks/useBlogPost";
import { usePostAutosave, type SaveStatus } from "../hooks/usePostAutosave";
import { usePublish } from "../hooks/usePublish";
import { useReviews } from "../hooks/useReviews";
import { useVoiceTemplate, parseContentTips, countBannedWords } from "../hooks/useVoiceTemplate";
import LangSplit from "../write/LangSplit";
import GateFiller from "../write/GateFiller";
import HeroImageTool from "../write/HeroImageTool";
import ScoreCards from "../write/ScoreCards";
import TipCards, { buildRichTips } from "../write/TipCards";
import BlogLibrary from "../write/BlogLibrary";
import SCBriefs from "../write/SCBriefs";
import OutlinePanel from "../write/OutlinePanel";
import IdeaBubble from "../write/IdeaBubble";
import VoiceTemplatePicker from "../write/VoiceTemplatePicker";

function StatusPill({ status, published }: { status: string; published: boolean }) {
  const cls = status === "published" || published ? "live" : status === "scheduled" ? "scheduled" : status === "review" ? "review" : "draft";
  const label = status === "published" || published ? "live" : status === "review" ? "in review" : status || "draft";
  return <span className={`stage-pill ${cls}`}>{label}</span>;
}

function SaveIndicator({ saveStatus, lastSaved, errorMessage }: { saveStatus: SaveStatus; lastSaved: Date | null; errorMessage: string | null }) {
  const style: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  };

  if (saveStatus === "saving") return <span style={{ ...style, color: "var(--ink-3)" }}>Saving...</span>;
  if (saveStatus === "error") return <span style={{ ...style, color: "var(--accent, #c00)" }} title={errorMessage ?? undefined}>Save failed</span>;
  if (saveStatus === "saved" && lastSaved) {
    const ago = Math.round((Date.now() - lastSaved.getTime()) / 1000);
    const label = ago < 5 ? "just now" : ago < 60 ? `${ago}s ago` : `${Math.floor(ago / 60)}m ago`;
    return <span className="save-state" style={{ ...style, color: "var(--ink-3)" }}><span className="pulse" />Saved {label}</span>;
  }
  if (saveStatus === "dirty") return <span style={{ ...style, color: "var(--ink-3)" }}>Unsaved</span>;
  return null;
}

export default function WriteMode({ postId }: { postId?: string }) {
  const state = useBlogPost(postId);
  const post = state.status === "loaded" ? state.post : null;
  const autosave = usePostAutosave(post);
  const pub = usePublish(() => state.refetch());
  const reviewsHook = useReviews(postId);
  const { template: voiceTemplate } = useVoiceTemplate(post?.category, post?.voice_template_id);
  const [showSchedule, setShowSchedule] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [linkTargets, setLinkTargets] = useState<{ title: string; slug: string }[]>([]);
  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.from("blog_posts").select("title, slug").eq("status", "published").eq("published", true).limit(30)
        .then(({ data }) => { if (data) setLinkTargets(data as { title: string; slug: string }[]); });
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") { e.preventDefault(); setFocusMode((f) => !f); }
      if (e.key === "Escape") setFocusMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("write-focus", focusMode);
    return () => document.body.classList.remove("write-focus");
  }, [focusMode]);
  const [scheduleDate, setScheduleDate] = useState("");

  const allContent = (autosave.fields.content ?? "") + " " + (autosave.fields.content_nl ?? "");
  const bannedHits = voiceTemplate ? countBannedWords(allContent, voiceTemplate.banned_words ?? []) : [];
  const contentTips = parseContentTips(voiceTemplate?.content_rules ?? null);

  const isLive = post?.status === "published" || post?.published;
  const isScheduled = post?.status === "scheduled";

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
              <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={() => setShowLibrary(true)}>Library</button>
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
        {showLibrary && <BlogLibrary onClose={() => setShowLibrary(false)} />}
      </>
    );
  }

  // Loading
  if (state.status === "loading") {
    return (
      <main className="main" style={{ display: "grid", placeItems: "center", minHeight: 400 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Loading post...
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

  // Loaded — editable
  const voiceScore = post!.voice_match_score ?? 0;
  const completenessScore = post!.completeness_score ?? 0;

  return (
    <>
      <main className="main">
        <section className="hero">
          <div className="hero-titleblock">
            <div className="eyebrow">
              <StatusPill status={post!.status} published={post!.published} />
              <span className="sep">·</span>
              <span>{post!.category}</span>
              <span className="sep">·</span>
              <VoiceTemplatePicker
                postId={post!.id}
                activeTemplate={voiceTemplate}
                assignedTemplateId={post!.voice_template_id}
                onChanged={state.refetch}
              />
              {post!.word_count != null && (
                <>
                  <span className="sep">·</span>
                  <span>{post!.word_count.toLocaleString()} words</span>
                </>
              )}
              <span className="sep">·</span>
              <SaveIndicator saveStatus={autosave.saveStatus} lastSaved={autosave.lastSaved} errorMessage={autosave.errorMessage} />
              {pub.action === "error" && (
                <>
                  <span className="sep">·</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent, #c00)" }}>{pub.errorMessage}</span>
                </>
              )}
            </div>
            <h1 className="h-wordmark">Schrijven<em>.</em></h1>
            <input
              className="title-input"
              type="text"
              value={autosave.fields.title}
              placeholder="Untitled draft"
              onChange={(e) => autosave.setField("title", e.target.value)}
            />
            <input
              className="title-input"
              type="text"
              value={autosave.fields.title_nl}
              placeholder="NL title"
              onChange={(e) => autosave.setField("title_nl", e.target.value)}
              style={{ marginTop: 8, opacity: 0.7, fontSize: "0.85em" }}
            />
          </div>
          <div className="hero-actions">
            <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={() => setShowLibrary(true)}>Library</button>
            <button
              className={`stamp-btn stamp-btn--ghost stamp-btn--sm${focusMode ? " is-active" : ""}`}
              onClick={() => setFocusMode((f) => !f)}
              title="Focus-modus (⌘. / Ctrl+.)"
            >
              {focusMode ? "Focus ✓" : "Focus"}
            </button>
            <button
              className="stamp-btn stamp-btn--ghost stamp-btn--sm"
              onClick={() => autosave.saveNow()}
              disabled={autosave.saveStatus === "saving" || autosave.saveStatus === "idle"}
            >
              {autosave.saveStatus === "saving" ? "Saving..." : "Save"}
            </button>

            {/* Schedule toggle */}
            {!isLive && (
              <button
                className="stamp-btn stamp-btn--ghost stamp-btn--sm"
                onClick={() => setShowSchedule((s) => !s)}
              >
                {isScheduled ? "Scheduled" : "Schedule"}
              </button>
            )}

            {/* Publish / Unpublish */}
            {isLive ? (
              <button
                className="stamp-btn stamp-btn--ghost stamp-btn--sm"
                onClick={async () => {
                  await autosave.saveNow();
                  await pub.unpublish(post!.id);
                }}
                disabled={pub.action === "unpublishing"}
              >
                {pub.action === "unpublishing" ? "Reverting..." : "Unpublish"}
              </button>
            ) : (
              <button
                className="stamp-btn"
                onClick={async () => {
                  await autosave.saveNow();
                  await pub.publish(post!.id);
                }}
                disabled={pub.action === "publishing"}
              >
                {pub.action === "publishing" ? "Publishing..." : "Publish"}
              </button>
            )}
          </div>
        </section>

        {/* Schedule picker */}
        {showSchedule && !isLive && (
          <div className="schedule-bar" style={{
            display: "flex", alignItems: "center", gap: "var(--s-3)",
            padding: "var(--s-3) var(--s-4)",
            background: "var(--bg-1)", borderRadius: "var(--r-2)",
            marginBottom: "var(--s-3)",
            fontFamily: "var(--font-mono)", fontSize: 12,
          }}>
            <label style={{ color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10 }}>
              Schedule for:
            </label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              style={{
                fontFamily: "var(--font-mono)", fontSize: 12,
                background: "var(--paper)", border: "1px solid var(--ink-2)",
                borderRadius: "var(--r-1)", padding: "4px 8px", color: "var(--ink-0)",
              }}
            />
            <button
              className="stamp-btn stamp-btn--sm"
              disabled={!scheduleDate || pub.action === "scheduling"}
              onClick={async () => {
                await autosave.saveNow();
                await pub.schedule(post!.id, new Date(scheduleDate).toISOString());
                setShowSchedule(false);
              }}
            >
              {pub.action === "scheduling" ? "Scheduling..." : "Confirm"}
            </button>
            {isScheduled && (
              <button
                className="stamp-btn stamp-btn--ghost stamp-btn--sm"
                onClick={async () => {
                  await pub.unpublish(post!.id);
                  setShowSchedule(false);
                }}
              >
                Cancel schedule
              </button>
            )}
            {post!.scheduled_at && (
              <span style={{ color: "var(--ink-3)", fontSize: 10 }}>
                Currently: {new Date(post!.scheduled_at).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Hero image (Gemini, design contract A2) */}
        <HeroImageTool
          postId={post!.id}
          title={post!.title}
          currentImage={post!.image_url ?? post!.og_image ?? null}
          onSaved={() => state.refetch()}
        />

        {/* Dual-language SPLIT editor (design contract A1) */}
        <LangSplit
          postId={post!.id}
          contentEN={autosave.fields.content}
          contentNL={autosave.fields.content_nl}
          onChangeEN={(md) => autosave.setField("content", md)}
          onChangeNL={(md) => autosave.setField("content_nl", md)}
          bannedWords={voiceTemplate?.banned_words ?? []}
          linkTargets={linkTargets.filter((t) => t.slug !== post!.slug)}
        />

        {/* Gate-vuller, neon A/B keuze per [HANS:]-gate uit de experience-bank */}
        <GateFiller
          contentEN={autosave.fields.content}
          contentNL={autosave.fields.content_nl}
          onChangeEN={(md) => autosave.setField("content", md)}
          onChangeNL={(md) => autosave.setField("content_nl", md)}
        />

        {/* Draggable idea bubble, page-session only */}
        <IdeaBubble
          onInsert={(md) => autosave.setField("content", `${autosave.fields.content.trimEnd()}\n\n${md}\n`)}
        />
      </main>

      <aside className="rail">
        {/* Outline, heading map of the EN draft */}
        <OutlinePanel markdown={autosave.fields.content} editorSelector=".paper--editor-en" />
        <SCBriefs />

        {/* Voice coaching card */}
        {voiceTemplate && (
          <>
            <h2 className="rail-h">Voice<em>.</em></h2>
            <div className="card voice-card">
              <div className="card-head">
                Active template
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, color: "var(--ink-0)", textTransform: "none" }}>
                  {voiceTemplate.category}
                </span>
              </div>
              <div className="name">{voiceTemplate.name} <em>/ {voiceTemplate.tone}</em></div>

              {/* Banned words hits */}
              {bannedHits.length > 0 && (
                <>
                  <div className="card-head" style={{ marginTop: "var(--s-3)" }}>
                    Banned words
                    <span style={{ color: "var(--draft)", fontWeight: 600 }}>{bannedHits.length} found</span>
                  </div>
                  <div className="banned-chips">
                    {bannedHits.map(({ word, count }) => (
                      <span key={word} className="banned-chip">
                        {word}
                        <span className="count">×{count}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
              {bannedHits.length === 0 && voiceTemplate.banned_words?.length > 0 && (
                <div className="fit">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  No banned words
                </div>
              )}

              {/* Readability targets */}
              {(voiceTemplate.max_sentence_words || voiceTemplate.passive_voice_max_pct) && (
                <div className="card-head" style={{ marginTop: "var(--s-3)" }}>Targets</div>
              )}
              {voiceTemplate.max_sentence_words && (
                <div className="sub">
                  <span>Max sentence</span>
                  <strong style={{ color: "var(--ink-0)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    {voiceTemplate.max_sentence_words} words
                  </strong>
                </div>
              )}
              {voiceTemplate.passive_voice_max_pct != null && (
                <div className="sub">
                  <span>Passive voice</span>
                  <strong style={{ color: "var(--ink-0)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    max {voiceTemplate.passive_voice_max_pct}%
                  </strong>
                </div>
              )}
            </div>

            {/* Writing tips (rijke cards, design contract A6) */}
            {contentTips.length > 0 && <TipCards tips={buildRichTips(contentTips)} />}
          </>
        )}

        <h2 className="rail-h" style={voiceTemplate ? { marginTop: "var(--s-4)" } : {}}>Score<em>.</em></h2>
        <ScoreCards
          voice={voiceScore}
          seo={post!.seo_score ?? 0}
          readability={completenessScore}
        />

        {/* Agent reviews */}
        <h2 className="rail-h" style={{ marginTop: "var(--s-4)" }}>Reviews<em>.</em></h2>
        <div className="card">
          <div style={{ display: "flex", gap: "var(--s-2)", marginBottom: "var(--s-3)" }}>
            <button
              className="stamp-btn stamp-btn--sm"
              disabled={reviewsHook.status === "running"}
              onClick={() => reviewsHook.runAgents(post!.id)}
            >
              {reviewsHook.status === "running" ? "Running..." : "Run agents"}
            </button>
            <button
              className="stamp-btn stamp-btn--ghost stamp-btn--sm"
              disabled={reviewsHook.imageStatus === "generating"}
              onClick={() => reviewsHook.generateImage(post!.id)}
            >
              {reviewsHook.imageStatus === "generating" ? "Generating..." : reviewsHook.imageStatus === "done" ? "Image done" : "Header image"}
            </button>
          </div>
          {reviewsHook.errorMessage && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent, #c00)", margin: "0 0 var(--s-2)" }}>
              {reviewsHook.errorMessage}
            </p>
          )}
          {reviewsHook.reviews.length === 0 && reviewsHook.status !== "running" && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              No reviews yet
            </p>
          )}
          {reviewsHook.reviews.map((r) => (
            <div key={r.id} style={{ borderTop: "1px solid var(--ink-2)", padding: "var(--s-2) 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600 }}>{r.agent_label}</span>
                {r.score != null && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: r.score >= 70 ? "var(--ink-1)" : "var(--accent, #c00)" }}>
                    {r.score}/100
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-2)", marginTop: 2 }}>
                {r.status} · {new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </aside>
      {showLibrary && <BlogLibrary onClose={() => setShowLibrary(false)} />}
    </>
  );
}
