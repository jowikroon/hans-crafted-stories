import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Analytics extras (design contract D1/D2/D3) ─────────────────────────────
// Hover-chart (cursor line + dot + tooltip), AI insight cards, per-post drilldown.

interface SeriesPoint { date: string; value: number }

// ── D2: Sessions area-chart with hover ──
export function HoverChart({ series }: { series: SeriesPoint[] }) {
  const [hover, setHover] = useState<{ x: number; i: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const ok = !!series && series.length >= 2;

  const w = 600, h = 140, pad = 8;
  const vals = (series ?? []).map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const xy = series.map((p, i) => ({
    x: pad + (i / (series.length - 1)) * (w - pad * 2),
    y: h - pad - ((p.value - min) / span) * (h - pad * 2),
  }));
  const line = xy.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `M${xy[0].x},${xy[0].y} L${line} L${(w - pad)},${h - pad} L${pad},${h - pad} Z`;

  const onMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * w;
    let nearest = 0, best = Infinity;
    xy.forEach((p, i) => { const d = Math.abs(p.x - px); if (d < best) { best = d; nearest = i; } });
    setHover({ x: xy[nearest].x, i: nearest });
  }, [xy]);

  const hp = hover && ok ? { ...xy[hover.i], pt: series[hover.i] } : null;
  if (!ok) return null;

  return (
    <div className="an-chart-wrap">
      <svg
        ref={svgRef}
        className="an-chart-svg"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="anFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ink-0)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--ink-0)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#anFill)" />
        <polyline points={line} fill="none" stroke="var(--ink-0)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {hp && (
          <>
            <line x1={hp.x} y1={pad} x2={hp.x} y2={h - pad} stroke="var(--ink-2)" strokeWidth="0.6" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
            <circle cx={hp.x} cy={hp.y} r="3.5" fill="var(--ink-0)" stroke="var(--bg-0)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      {hp && (
        <div className="an-chart-tip" style={{ left: `${(hp.x / w) * 100}%` }}>
          <span className="an-tip-val">{hp.pt.value.toLocaleString()}</span>
          <span className="an-tip-date">{hp.pt.date}</span>
        </div>
      )}
    </div>
  );
}

// ── D1: AI insight cards ──
interface Insight { title: string; body: string }
type Insights = { working?: Insight; watch?: Insight; idea?: Insight };

export function InsightCards({ statsSummary }: { statsSummary: string }) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!statsSummary.trim()) return;
    setBusy(true); setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("analytics-insights", { body: { stats: statsSummary } });
      if (fnErr) throw new Error(fnErr.message);
      const d = (data ?? {}) as { insights?: Insights; error?: string };
      if (d.error) throw new Error(d.error);
      setInsights(d.insights ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Insights mislukt");
    } finally { setBusy(false); }
  }, [statsSummary]);

  const cards: { key: keyof Insights; cls: string; tag: string }[] = [
    { key: "working", cls: "insight-up", tag: "Wat werkt" },
    { key: "watch", cls: "insight-warn", tag: "Wat te bewaken" },
    { key: "idea", cls: "insight-idea", tag: "Idee" },
  ];

  return (
    <div className="chart-card">
      <div className="insights-head">
        <h3 style={{ margin: 0 }}>AI insights <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>claude-haiku · leest GA + SC</span></h3>
        <button className="an-refresh-btn" onClick={load} disabled={busy}>{busy ? "⟳ Synthesise…" : insights ? "Refresh" : "Generate"}</button>
      </div>
      {error && <div className="an-insight-error">{error}</div>}
      {!insights && !busy && !error && <p className="an-insight-empty">Klik Generate — Claude leest je GA4 + Search Console + redactionele cijfers en geeft 3 inzichten.</p>}
      {insights && (
        <div className="insights-row">
          {cards.map(({ key, cls, tag }) => insights[key] && (
            <div key={key} className={`insight-card ${cls}`}>
              <div className="ic-tag">{tag}</div>
              <h4>{insights[key]!.title}</h4>
              <p>{insights[key]!.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── D3: per-post drilldown drawer ──
export interface DrillPost {
  id: string; title: string; slug?: string;
  word_count: number | null; voice_match_score: number | null; seo_score: number | null; completeness_score: number | null;
  category: string; updated_at: string;
}

export function DrilldownDrawer({ post, onClose }: { post: DrillPost | null; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  if (!post) return null;
  const metrics = [
    { k: "Words", v: (post.word_count ?? 0).toLocaleString() },
    { k: "Voice", v: post.voice_match_score != null ? `${post.voice_match_score}/100` : "–" },
    { k: "SEO", v: post.seo_score != null ? `${post.seo_score}/100` : "–" },
    { k: "Completeness", v: post.completeness_score != null ? `${post.completeness_score}/100` : "–" },
  ];
  return (
    <>
      <div className="an-drill-scrim" onClick={onClose} />
      <aside className="an-drill">
        <div className="an-drill-head">
          <button className="an-drill-close" onClick={onClose}>×</button>
          <div className="src-tag">editorial</div>
          <div className="an-drill-title">{post.title}</div>
          <div className="an-drill-slug">{post.slug ? `/writing/${post.slug}` : post.category}</div>
        </div>
        <div className="an-drill-body">
          <div className="an-drill-grid">
            {metrics.map((m) => (
              <div key={m.k} className="an-drill-metric">
                <div className="an-drill-mk">{m.k}</div>
                <div className="an-drill-mv">{m.v}</div>
              </div>
            ))}
          </div>
          <div className="an-drill-sec">
            <div className="an-drill-sec-h">Waar het beter kan</div>
            <ul className="an-drill-improve">
              {(post.seo_score ?? 0) < 70 && <li>SEO-score onder 70 — keyword vroeg plaatsen + interne link.</li>}
              {(post.voice_match_score ?? 0) < 70 && <li>Voice-match laag — calibratiezin + signature phrases inzetten.</li>}
              {(post.completeness_score ?? 0) < 70 && <li>Nog niet compleet — open [HANS:]-gates invullen.</li>}
              {(post.word_count ?? 0) < 800 && <li>Kort artikel ({post.word_count ?? 0} woorden) — uitdiepen voor autoriteit.</li>}
              {(post.seo_score ?? 0) >= 70 && (post.voice_match_score ?? 0) >= 70 && (post.completeness_score ?? 0) >= 70 && (post.word_count ?? 0) >= 800 && <li>Sterk artikel — overweeg een LinkedIn-herpublicatie.</li>}
            </ul>
          </div>
          <div className="an-drill-foot">Laatst bijgewerkt {new Date(post.updated_at).toLocaleDateString()}</div>
        </div>
      </aside>
    </>
  );
}
