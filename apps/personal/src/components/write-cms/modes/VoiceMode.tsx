// VoiceMode — Phase D 4th-tab CRUD surface for hvl_voice_templates.
//
// Layout: master/detail.
//   Left  — VoiceTemplatesList: searchable list of active templates (archived
//           rows hidden). Shows name, category, tone, default badge, banned-word
//           count, last-updated. Click to select; selection populates the right
//           pane.
//   Right — VoiceTemplateSummary: read-only summary of the selected template
//           (tone, banned/preferred/required terms, opening/transition/closing
//           examples, content rules). Includes an "Edit in full editor" CTA
//           that opens the existing /blog-cms/voice/:id route in the same tab.
//
// Hans wanted the 4th tab without re-implementing the 730-line full editor; the
// existing VoiceTemplateEditor at /blog-cms/voice/:id stays the source of truth
// for full CRUD. The 4th tab gives quick selection/preview inside the CMS.
//
// Schema reads: hvl_voice_templates (id, name, category, tone, banned_words,
// preferred_terms, required_elements, opening_examples, transition_examples,
// closing_examples, content_rules, seo_guidelines, language, is_default,
// archived_at, updated_at).

import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface VoiceTemplateRow {
  id: string;
  name: string;
  category: string;
  tone: string | null;
  banned_words: string[] | null;
  preferred_terms: string[] | null;
  required_elements: string[] | null;
  opening_examples: string[] | null;
  transition_examples: string[] | null;
  closing_examples: string[] | null;
  content_rules: string | null;
  seo_guidelines: string | null;
  language: string | null;
  description: string | null;
  short_code: string | null;
  is_default: boolean;
  updated_at: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(ms / 86400000);
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function VoiceTemplatesList({
  templates,
  search,
  setSearch,
  activeId,
  onPick,
  loading,
}: {
  templates: VoiceTemplateRow[];
  search: string;
  setSearch: (s: string) => void;
  activeId: string | null;
  onPick: (id: string) => void;
  loading: boolean;
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.tone ?? "").toLowerCase().includes(q) ||
        (t.short_code ?? "").toLowerCase().includes(q),
    );
  }, [templates, search]);

  return (
    <aside className="voice-list">
      <div className="voice-list-toolbar">
        <input
          type="text"
          className="voice-list-search"
          placeholder="Filter templates…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading && (
        <div className="voice-list-empty">Loading…</div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="voice-list-empty">
          {templates.length === 0 ? "No templates yet" : "No matches"}
        </div>
      )}
      <ul className="voice-list-items">
        {filtered.map((t) => {
          const isActive = t.id === activeId;
          const bannedCount = t.banned_words?.length ?? 0;
          return (
            <li key={t.id}>
              <button
                className={`voice-list-item${isActive ? " on" : ""}`}
                onClick={() => onPick(t.id)}
                aria-current={isActive ? "true" : undefined}
              >
                <div className="voice-list-item-head">
                  <span className="voice-list-item-name">{t.name}</span>
                  {t.is_default && <span className="voice-list-item-default">default</span>}
                </div>
                <div className="voice-list-item-meta">
                  <span className="voice-list-item-cat">{t.category}</span>
                  {t.tone && <span className="sep">·</span>}
                  {t.tone && <span className="voice-list-item-tone">{t.tone}</span>}
                </div>
                <div className="voice-list-item-foot">
                  {bannedCount > 0 && (
                    <span className="voice-list-item-chip">{bannedCount} banned</span>
                  )}
                  {t.language && <span className="voice-list-item-chip">{t.language}</span>}
                  <span className="voice-list-item-ago">{timeAgo(t.updated_at)}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function Chips({ items, kind }: { items: string[] | null | undefined; kind: "banned" | "preferred" | "required" }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`voice-chip-row voice-chip-row--${kind}`}>
      {items.map((w) => (
        <span key={w} className={`voice-chip voice-chip--${kind}`}>{w}</span>
      ))}
    </div>
  );
}

function ExamplesBlock({ title, items }: { title: string; items: string[] | null | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="voice-examples">
      <h3 className="voice-section-h">{title}</h3>
      <ul className="voice-examples-list">
        {items.map((s, i) => (
          <li key={i}><blockquote>{s}</blockquote></li>
        ))}
      </ul>
    </section>
  );
}

function VoiceTemplateSummary({ template }: { template: VoiceTemplateRow | null }) {
  const navigate = useNavigate();
  if (!template) {
    return (
      <main className="main voice-main voice-main--empty">
        <p className="voice-empty-hint">Select a template on the left.</p>
      </main>
    );
  }
  return (
    <main className="main voice-main">
      <header className="voice-summary-head">
        <div>
          <div className="eyebrow">
            <span className="stage-pill">{template.category}</span>
            {template.is_default && (
              <>
                <span className="sep">·</span>
                <span className="voice-list-item-default">default</span>
              </>
            )}
            {template.short_code && (
              <>
                <span className="sep">·</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-2)" }}>
                  {template.short_code}
                </span>
              </>
            )}
          </div>
          <h1 className="h-wordmark">{template.name}<em>.</em></h1>
          {template.tone && (
            <p className="voice-summary-tone">Tone: <strong>{template.tone}</strong></p>
          )}
          {template.description && (
            <p className="voice-summary-desc">{template.description}</p>
          )}
        </div>
        <div className="voice-summary-actions">
          <button
            className="stamp-btn"
            onClick={() => navigate(`/blog-cms/voice/${template.id}`)}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M2 14h12M11 3l2 2-7 7H4v-2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit in full editor
          </button>
        </div>
      </header>

      <section className="voice-pane-grid">
        <div className="voice-pane">
          <h3 className="voice-section-h">Banned words</h3>
          {template.banned_words?.length ? <Chips items={template.banned_words} kind="banned" /> : <p className="voice-pane-empty">— none configured —</p>}
        </div>
        <div className="voice-pane">
          <h3 className="voice-section-h">Preferred terms</h3>
          {template.preferred_terms?.length ? <Chips items={template.preferred_terms} kind="preferred" /> : <p className="voice-pane-empty">— none configured —</p>}
        </div>
        <div className="voice-pane">
          <h3 className="voice-section-h">Required elements</h3>
          {template.required_elements?.length ? <Chips items={template.required_elements} kind="required" /> : <p className="voice-pane-empty">— none configured —</p>}
        </div>
      </section>

      <ExamplesBlock title="Opening examples" items={template.opening_examples} />
      <ExamplesBlock title="Transition examples" items={template.transition_examples} />
      <ExamplesBlock title="Closing examples" items={template.closing_examples} />

      {template.content_rules && (
        <section className="voice-rules">
          <h3 className="voice-section-h">Content rules</h3>
          <pre className="voice-rules-pre">{template.content_rules}</pre>
        </section>
      )}

      {template.seo_guidelines && (
        <section className="voice-rules">
          <h3 className="voice-section-h">SEO guidelines</h3>
          <pre className="voice-rules-pre">{template.seo_guidelines}</pre>
        </section>
      )}
    </main>
  );
}

export default function VoiceMode() {
  const [templates, setTemplates] = useState<VoiceTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
      .from("hvl_voice_templates")
      .select("id,name,category,tone,banned_words,preferred_terms,required_elements,opening_examples,transition_examples,closing_examples,content_rules,seo_guidelines,language,description,short_code,is_default,updated_at,archived_at")
      .is("archived_at", null)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false }) as { data: VoiceTemplateRow[] | null };
    const rows = data ?? [];
    setTemplates(rows);
    if (!activeId && rows.length > 0) setActiveId(rows[0].id);
    setLoading(false);
  }, [activeId]);

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = useMemo(
    () => templates.find((t) => t.id === activeId) ?? null,
    [templates, activeId],
  );

  return (
    <>
      <VoiceTemplatesList
        templates={templates}
        search={search}
        setSearch={setSearch}
        activeId={activeId}
        onPick={setActiveId}
        loading={loading}
      />
      <VoiceTemplateSummary template={active} />
    </>
  );
}
