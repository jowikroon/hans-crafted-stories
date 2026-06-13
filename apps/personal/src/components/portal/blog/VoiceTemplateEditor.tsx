// apps/personal/src/components/portal/blog/VoiceTemplateEditor.tsx
// Full 9-section voice template editor matching the design.
// Reads and writes hvl_voice_templates.
//
// Wire into routing: <Route path="/portal/blog/voice/:id" element={<VoiceTemplateEditor />} />
// or use as a modal/drawer.

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Save, Sparkles, Check, X, Wand2 } from "lucide-react";
import {
  Radar, Spectrum, SecLabel, Chip, Eyebrow,
} from "./primitives";
import { type VoiceTemplate as VT } from "@/lib/blog/voice-analysis";
import { ADS_AUDIENCES, AUDIENCE_CATEGORIES } from "./googleAdsAudiences";

interface VTFull extends VT {
  is_default: boolean;
  category: string;
  description: string;
  short_code: string;
  language: string;
  inclusivity_rules: string;
  content_rules: string;
  seo_guidelines: string;
  required_elements: string[];
  // Voice DNA (design contract #16)
  calibration_sentence: string;
  signature_phrases: string[];
  strengths: string[];
  watch_outs: string[];
  unique_markers: string[];
  tone_per_section: Record<string, string>;
}

const WRITING_STYLE_RULES: { key: string; label: string }[] = [
  { key: "open_with_claim", label: "Open with a claim, not a hook" },
  { key: "one_sentence_paragraphs", label: "One-sentence paragraphs OK" },
  { key: "em_dashes", label: "Em-dashes — yes, liberally" },
  { key: "oxford_comma", label: "Oxford comma" },
  { key: "rhetorical_questions", label: "Rhetorical questions" },
  { key: "hedging", label: 'Hedging ("perhaps", "maybe")' },
  { key: "first_person_plural", label: "First-person plural" },
  { key: "numbered_lists", label: "Numbered lists for sequences" },
  { key: "block_quotes_for_stats", label: "Block quotes for stats" },
  { key: "subheads_every_250_words", label: "Subheads every ~250 words" },
];

const CONTENT_RULE_CHECKS = [
  { name: "Claim density", rule: "At least 1 defensible claim per 150 words" },
  { name: "Source citations", rule: "Every statistic must link to source (gov/industry > blog)" },
  { name: "Brand name mentions", rule: "Bol.com, Amazon.nl ≤ 8× combined per piece" },
  { name: "Self-references", rule: '"I", "my", "me" ≤ 4× per 1000 words' },
  { name: "AI disclosure", rule: "If >30% AI-assisted, disclose in footer" },
];

// ─── Root ─────────────────────────────────────────────────────────────────
export default function VoiceTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<VTFull[]>([]);
  const [activeId, setActiveId] = useState<string | null>(id ?? null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("hvl_voice_templates")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at");
    if (error) {
      toast({ title: "Load failed", description: error.message, variant: "destructive" });
      return;
    }
    const rows = (data ?? []) as unknown as VTFull[];
    setTemplates(rows);
    if (!activeId && rows.length) setActiveId(rows[0].id);
  }, [toast, activeId]);

  useEffect(() => {
    load();
  }, [load]);

  const active = templates.find((t) => t.id === activeId) ?? null;

  const patch = (updates: Partial<VTFull>) => {
    if (!active) return;
    setTemplates((ts) => ts.map((t) => (t.id === active.id ? { ...t, ...updates } : t)));
  };

  const save = async () => {
    if (!active) return;
    setSaving(true);
    const { id: _id, ...rest } = active;
    const { error } = await supabase.from("hvl_voice_templates").update(rest).eq("id", active.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Template saved", description: active.name });
    await load();
  };

  if (!active) {
    return <div className="p-12 text-muted-foreground">Loading voice templates…</div>;
  }

  return (
    <div className="dark bg-background text-foreground font-sans flex" style={{ minHeight: "100vh" }}>
      {/* LEFT RAIL — template list */}
      <aside
        className="w-[280px] border-r border-border/60 flex flex-col gap-5"
        style={{ padding: "28px 24px" }}
      >
        <div className="flex items-center justify-between">
          <Eyebrow>Voice templates</Eyebrow>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            +
          </Button>
        </div>
        {templates.map((t) => {
          const isActive = t.id === activeId;
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className="rounded p-3.5 text-left relative border transition-colors"
              style={{
                borderColor: isActive ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border) / 0.6)",
                background: isActive ? "hsl(var(--primary) / 0.05)" : "hsl(var(--card))",
              }}
            >
              {isActive && (
                <div
                  className="absolute top-3.5 bottom-3.5 w-0.5 rounded"
                  style={{ left: 0, background: "hsl(var(--primary))" }}
                />
              )}
              <div className="flex justify-between items-center mb-2.5">
                <div className="font-display text-[15px] font-medium">{t.name}</div>
              </div>
              <div className="font-mono text-[9.5px] tracking-wider text-muted-foreground mb-2">
                {t.is_default ? "DEFAULT · " : ""}GRADE {t.target_reading_level}
              </div>
              <div className="flex items-center justify-between mt-2">
                <Radar
                  values={[t.formality, t.humor, t.respectfulness, t.enthusiasm]}
                  size={80}
                  rings={3}
                  showLabels={false}
                  fillOpacity={isActive ? 0.25 : 0.15}
                  stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                />
                <div className="flex flex-col gap-1 font-mono text-[10px] text-muted-foreground">
                  <div>
                    FORM <span className="text-foreground">{t.formality}</span>
                  </div>
                  <div>
                    HUMR <span className="text-foreground">{t.humor}</span>
                  </div>
                  <div>
                    RESP <span className="text-foreground">{t.respectfulness}</span>
                  </div>
                  <div>
                    ENTH <span className="text-foreground">{t.enthusiasm}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </aside>

      {/* CENTER — form */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* header */}
        <div
          className="flex justify-between items-center"
          style={{ padding: "24px 32px", borderBottom: "1px solid hsl(var(--border) / 0.6)" }}
        >
          <div className="flex flex-col gap-1.5">
            <Eyebrow>Editing voice template · last modified today</Eyebrow>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-[28px] font-medium tracking-tight">
                {active.name}
              </h1>
              {active.is_default && (
                <Chip tone="primary" dot>
                  DEFAULT
                </Chip>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/portal/blog")}>
              Back to CMS
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              <Save size={12} className="mr-1" />
              {saving ? "Saving..." : "Save template"}
            </Button>
          </div>
        </div>

        {/* form body */}
        <div className="flex flex-col gap-10" style={{ padding: "32px 32px 64px", maxWidth: 960 }}>
          {/* 01 IDENTITY */}
          <FormSection idx={1} title="Identity" subtitle="How this template introduces itself">
            <div className="flex gap-6">
              <Field label="Template name" className="flex-1">
                <input
                  className="input-base"
                  value={active.name}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </Field>
              <Field label="Short code">
                <input
                  className="input-base font-mono w-36"
                  value={active.short_code ?? ""}
                  onChange={(e) => patch({ short_code: e.target.value })}
                />
              </Field>
              <Field label="Language">
                <input
                  className="input-base w-32"
                  value={active.language ?? "English (UK)"}
                  onChange={(e) => patch({ language: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                className="input-base resize-none"
                rows={2}
                value={active.description ?? ""}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </Field>
          </FormSection>

          {/* 03 CORE VOICE */}
          <FormSection
            idx={3}
            title="Core voice"
            subtitle="Nielsen Norman Group 4-axis tone model"
          >
            <div className="flex gap-8">
              <div className="flex-1 flex flex-col gap-6">
                <Spectrum
                  leftLabel="Casual"
                  rightLabel="Formal"
                  value={active.formality}
                  target={active.formality}
                  onChange={(v) => patch({ formality: v })}
                />
                <Spectrum
                  leftLabel="Serious"
                  rightLabel="Playful"
                  value={active.humor}
                  target={active.humor}
                  onChange={(v) => patch({ humor: v })}
                />
                <Spectrum
                  leftLabel="Irreverent"
                  rightLabel="Respectful"
                  value={active.respectfulness}
                  target={active.respectfulness}
                  onChange={(v) => patch({ respectfulness: v })}
                />
                <Spectrum
                  leftLabel="Matter-of-fact"
                  rightLabel="Enthusiastic"
                  value={active.enthusiasm}
                  target={active.enthusiasm}
                  onChange={(v) => patch({ enthusiasm: v })}
                />
              </div>
              <div
                className="rounded border flex flex-col items-center gap-3"
                style={{
                  width: 280,
                  padding: 20,
                  background: "hsl(var(--card))",
                  borderColor: "hsl(var(--border) / 0.6)",
                }}
              >
                <Eyebrow>Live fingerprint</Eyebrow>
                <Radar
                  values={[
                    active.formality,
                    active.humor,
                    active.respectfulness,
                    active.enthusiasm,
                  ]}
                  size={220}
                  rings={5}
                />
                <div className="font-mono text-[10px] text-muted-foreground tracking-wider text-center">
                  SHAPE SIGNATURE · F{active.formality}·H{active.humor}·R{active.respectfulness}·E
                  {active.enthusiasm}
                </div>
              </div>
            </div>
          </FormSection>

          {/* 04 READABILITY */}
          <FormSection
            idx={4}
            title="Readability target"
            subtitle="Flesch–Kincaid grade level & sentence pacing"
          >
            <Field label="Target grade level">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={4}
                  max={16}
                  value={active.target_reading_level}
                  onChange={(e) => patch({ target_reading_level: parseInt(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <span className="font-mono text-[20px] text-primary font-medium w-10 text-right">
                  {active.target_reading_level}
                </span>
              </div>
              <div className="flex justify-between font-mono text-[9.5px] text-muted-foreground tracking-wider mt-1">
                <span>GRADE 4 · EASY</span>
                <span>GRADE 9 · GENERAL</span>
                <span>GRADE 16 · ACADEMIC</span>
              </div>
            </Field>
            <div className="flex gap-4">
              <Field label="Max sentence length" className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="input-base font-mono w-20"
                    value={active.max_sentence_words}
                    onChange={(e) =>
                      patch({ max_sentence_words: parseInt(e.target.value) || 28 })
                    }
                  />
                  <span className="text-muted-foreground text-xs">words</span>
                </div>
              </Field>
              <Field label="Avg paragraph" className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="input-base font-mono w-20"
                    value={active.avg_paragraph_sentences}
                    onChange={(e) =>
                      patch({ avg_paragraph_sentences: parseInt(e.target.value) || 3 })
                    }
                  />
                  <span className="text-muted-foreground text-xs">sentences</span>
                </div>
              </Field>
              <Field label="Passive voice max" className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="input-base font-mono w-20"
                    value={active.passive_voice_max_pct}
                    onChange={(e) =>
                      patch({ passive_voice_max_pct: parseInt(e.target.value) || 8 })
                    }
                  />
                  <span className="text-muted-foreground text-xs">%</span>
                </div>
              </Field>
            </div>
          </FormSection>

          {/* 05 WRITING STYLE */}
          <FormSection idx={5} title="Writing style" subtitle="Structural and rhythmic preferences">
            <div className="flex gap-4 flex-wrap">
              {WRITING_STYLE_RULES.map((rule) => {
                const on = !!active.writing_style_rules?.[rule.key];
                return (
                  <button
                    key={rule.key}
                    onClick={() =>
                      patch({
                        writing_style_rules: {
                          ...active.writing_style_rules,
                          [rule.key]: !on,
                        },
                      })
                    }
                    className="flex items-center gap-2 px-3 py-2 rounded text-[12.5px] border transition-colors"
                    style={{
                      borderColor: on ? "hsl(var(--primary) / 0.35)" : "hsl(var(--border))",
                      background: on ? "hsl(var(--primary) / 0.06)" : "transparent",
                      color: on ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-sm flex items-center justify-center"
                      style={{
                        border: `1.5px solid ${
                          on ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"
                        }`,
                        background: on ? "hsl(var(--primary))" : "transparent",
                        color: "hsl(var(--primary-foreground))",
                      }}
                    >
                      {on && <Check size={9} strokeWidth={3} />}
                    </div>
                    <span>{rule.label}</span>
                  </button>
                );
              })}
            </div>
          </FormSection>

          {/* 06 TERMINOLOGY */}
          <FormSection
            idx={6}
            title="Terminology"
            subtitle="Three-tier lexicon: preferred · pending · banned"
          >
            <div className="flex gap-4 items-stretch">
              <TermTier
                tone="green"
                title="Preferred"
                desc="Use these. Auto-suggest in editor."
                items={active.preferred_terms ?? []}
                onChange={(terms) => patch({ preferred_terms: terms })}
              />
              <TermTier
                tone="amber"
                title="Pending review"
                desc="I used these. Approve or ban."
                items={active.pending_terms ?? []}
                onChange={(terms) => patch({ pending_terms: terms })}
                actions
                onApprove={(term) =>
                  patch({
                    preferred_terms: [...(active.preferred_terms ?? []), term],
                    pending_terms: (active.pending_terms ?? []).filter((x) => x !== term),
                  })
                }
                onBan={(term) =>
                  patch({
                    banned_words: [...(active.banned_words ?? []), term],
                    pending_terms: (active.pending_terms ?? []).filter((x) => x !== term),
                  })
                }
              />
              <TermTier
                tone="red"
                title="Banned"
                desc="Flag in editor. Replace on export."
                items={active.banned_words ?? []}
                onChange={(terms) => patch({ banned_words: terms })}
                strike
              />
            </div>
          </FormSection>

          {/* 07 REQUIRED ELEMENTS */}
          <FormSection
            idx={7}
            title="Required elements"
            subtitle="Must appear in every published article"
          >
            <div className="flex gap-2.5 flex-wrap">
              {(active.required_elements ?? []).map((r, i) => (
                <div
                  key={r + i}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded border border-border/60 text-[12.5px]"
                  style={{ background: "hsl(var(--card) / 0.4)" }}
                >
                  <Check size={13} className="text-primary" strokeWidth={2.5} />
                  <span>{r}</span>
                  <button
                    onClick={() =>
                      patch({
                        required_elements: (active.required_elements ?? []).filter(
                          (x) => x !== r
                        ),
                      })
                    }
                    className="text-muted-foreground hover:text-foreground ml-1"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              <AddTermInput
                placeholder="+ required element"
                onAdd={(v) =>
                  patch({ required_elements: [...(active.required_elements ?? []), v] })
                }
              />
            </div>
          </FormSection>

          {/* 08 CONTENT RULES */}
          <FormSection
            idx={8}
            title="Content rules"
            subtitle="Hard constraints checked before publish"
          >
            <div className="flex flex-col">
              {CONTENT_RULE_CHECKS.map((c, i) => (
                <div
                  key={c.name}
                  className="flex justify-between items-center py-3.5"
                  style={{
                    borderBottom:
                      i < CONTENT_RULE_CHECKS.length - 1 ? "1px solid hsl(var(--border) / 0.6)" : "none",
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Chip tone="green" className="w-[58px] justify-center">
                      PASS
                    </Chip>
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[13px] font-medium">{c.name}</div>
                      <div className="text-[11.5px] text-muted-foreground">{c.rule}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FormSection>

          {/* 09 SEO */}
          <FormSection
            idx={9}
            title="SEO guidelines"
            subtitle="Applied per-post before publish"
          >
            <Field label="SEO notes">
              <textarea
                className="input-base"
                rows={4}
                value={active.seo_guidelines ?? ""}
                onChange={(e) => patch({ seo_guidelines: e.target.value })}
                placeholder="e.g. Title length 55–65 chars. Meta description 140–155. Primary keyword in first paragraph. One internal link minimum."
              />
            </Field>
          </FormSection>

          {/* 10 VOICE DNA */}
          <FormSection
            idx={10}
            title="Voice DNA"
            subtitle="The fingerprint: one calibration sentence + the phrases and habits that make it unmistakably Hans"
          >
            <Field label="Calibration sentence — one sentence that IS this voice. Sharpest anti-AI-detection lever; every draft is calibrated against it.">
              <textarea
                className="input-base"
                rows={2}
                value={active.calibration_sentence ?? ""}
                onChange={(e) => patch({ calibration_sentence: e.target.value })}
                placeholder='e.g. "Bol is geen vijand van Amazon — het is je oefenterrein, en wie dat snapt wint op allebei."'
              />
            </Field>
            <DnaChipField
              label="Signature phrases"
              desc="Recurring phrases readers recognize"
              items={active.signature_phrases ?? []}
              onChange={(v) => patch({ signature_phrases: v })}
              placeholder="+ signature phrase"
            />
            <DnaChipField
              label="Strengths"
              desc="What this voice does well — lean into these"
              items={active.strengths ?? []}
              onChange={(v) => patch({ strengths: v })}
              placeholder="+ strength"
            />
            <DnaChipField
              label="Watch-outs"
              desc="Habits to avoid — the editor flags drift toward these"
              items={active.watch_outs ?? []}
              onChange={(v) => patch({ watch_outs: v })}
              placeholder="+ watch-out"
            />
            <DnaChipField
              label="Unique markers"
              desc="Quirks that distinguish Hans from generic AI prose"
              items={active.unique_markers ?? []}
              onChange={(v) => patch({ unique_markers: v })}
              placeholder="+ unique marker"
            />
            <Field label="Tone per sectie — verschillende toon per deel van het artikel">
              <div className="flex flex-col gap-2">
                {["Opening", "Probleem", "Kern/Framework", "Bewijs", "Slot"].map((sec) => (
                  <div key={sec} className="flex items-center gap-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground w-28 shrink-0">{sec}</span>
                    <input
                      className="input-base flex-1"
                      value={(active.tone_per_section ?? {})[sec] ?? ""}
                      onChange={(e) => patch({ tone_per_section: { ...(active.tone_per_section ?? {}), [sec]: e.target.value } })}
                      placeholder={sec === "Opening" ? "bv. persoonlijk, hakend" : sec === "Slot" ? "bv. declaratief, kort" : "bv. analytisch"}
                    />
                  </div>
                ))}
              </div>
            </Field>
          </FormSection>

          {/* 11 TARGET AUDIENCE — Google Ads audience picker (design contract #17) */}
          <FormSection
            idx={11}
            title="Target audience"
            subtitle="Google Ads audience-taxonomie — selecties voeden target_audience en de ghost-writer"
          >
            <AudiencePicker
              value={active.target_audience ?? ""}
              onChange={(v) => patch({ target_audience: v })}
            />
          </FormSection>

          {/* 12 ANALYZE WRITING SAMPLE — voice extract (design contract #18) */}
          <FormSection
            idx={12}
            title="Analyze writing sample"
            subtitle="Plak tekst of drop een .txt/.md — Claude vult het template met confidence-scores"
          >
            <SampleAnalyzer
              onApply={(updates) => patch(updates)}
              current={active}
            />
          </FormSection>
        </div>

        {/* Completion wizard — fixed right panel */}
        <CompletionWizard template={active} />
      </main>

      {/* Global input styles — scoped to this component */}
      <style>{`
        .input-base {
          width: 100%;
          background: hsl(var(--card) / 0.6);
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          padding: 8px 12px;
          border-radius: 4px;
          font-family: var(--font-sans, Inter, system-ui);
          font-size: 13px;
          outline: none;
          transition: border-color .15s;
        }
        .input-base:focus { border-color: hsl(var(--primary) / 0.6); }
      `}</style>
    </div>
  );
}

// ─── FormSection ──────────────────────────────────────────────────────────
function FormSection({
  idx,
  title,
  subtitle,
  accessory,
  children,
}: {
  idx: number;
  title: string;
  subtitle?: string;
  accessory?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={`vt-sec-${idx}`} className="flex flex-col gap-5 scroll-mt-24">
      <div className="flex items-center justify-between">
        <SecLabel idx={idx}>{title}</SecLabel>
        {accessory}
      </div>
      {subtitle && (
        <div className="text-[12.5px] text-muted-foreground -mt-3 font-sans">{subtitle}</div>
      )}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── TermTier ─────────────────────────────────────────────────────────────
function TermTier({
  tone,
  title,
  desc,
  items,
  onChange,
  actions,
  onApprove,
  onBan,
  strike,
}: {
  tone: "green" | "amber" | "red";
  title: string;
  desc: string;
  items: string[];
  onChange: (items: string[]) => void;
  actions?: boolean;
  onApprove?: (term: string) => void;
  onBan?: (term: string) => void;
  strike?: boolean;
}) {
  return (
    <div
      className="flex-1 rounded border p-4 flex flex-col gap-3"
      style={{ borderColor: "hsl(var(--border) / 0.6)", background: "hsl(var(--card) / 0.4)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-[14px] font-medium">{title}</div>
          <div className="text-[11px] text-muted-foreground leading-tight">{desc}</div>
        </div>
        <Chip tone={tone}>{items.length}</Chip>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t) => (
          <div key={t} className="flex items-center gap-1">
            <Chip tone={tone} strike={strike}>
              {t}
            </Chip>
            {actions ? (
              <>
                <button
                  onClick={() => onApprove?.(t)}
                  title="Approve"
                  className="w-[18px] h-[18px] flex items-center justify-center rounded text-[hsl(140_35%_55%)] hover:bg-muted/40"
                >
                  <Check size={10} />
                </button>
                <button
                  onClick={() => onBan?.(t)}
                  title="Ban"
                  className="w-[18px] h-[18px] flex items-center justify-center rounded text-[hsl(0_55%_58%)] hover:bg-muted/40"
                >
                  <X size={10} />
                </button>
              </>
            ) : (
              <button
                onClick={() => onChange(items.filter((x) => x !== t))}
                className="w-[18px] h-[18px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        <AddTermInput placeholder="+ add" onAdd={(v) => onChange([...items, v])} />
      </div>
    </div>
  );
}

function AddTermInput({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (v: string) => void;
}) {
  const [val, setVal] = useState("");
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 h-[22px] px-2 rounded border border-border font-mono text-[10.5px] text-muted-foreground hover:text-foreground"
      >
        {placeholder}
      </button>
    );
  return (
    <input
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val.trim()) onAdd(val.trim());
        setVal("");
        setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && val.trim()) {
          onAdd(val.trim());
          setVal("");
          setOpen(false);
        } else if (e.key === "Escape") {
          setVal("");
          setOpen(false);
        }
      }}
      className="h-[22px] px-2 rounded border border-border bg-transparent font-mono text-[10.5px] w-28 outline-none focus:border-primary/60"
      placeholder="term"
    />
  );
}


// ─── Voice DNA chip field ─────────────────────────────────────────────────
function DnaChipField({
  label, desc, items, onChange, placeholder,
}: {
  label: string;
  desc: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <Field label={`${label} — ${desc}`}>
      <div className="flex gap-2 flex-wrap">
        {items.map((it, i) => (
          <div
            key={it + i}
            className="flex items-center gap-2 px-3 py-2 rounded border border-border/60 text-[12.5px]"
            style={{ background: "hsl(var(--card) / 0.4)" }}
          >
            <span>{it}</span>
            <button
              onClick={() => onChange(items.filter((x) => x !== it))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={11} />
            </button>
          </div>
        ))}
        <AddTermInput placeholder={placeholder} onAdd={(v) => onChange([...items, v])} />
      </div>
    </Field>
  );
}

// ─── Completion wizard (design contract #19) ──────────────────────────────
interface WizardCheck {
  label: string;
  done: boolean;
  sectionIdx: number;
}

function buildWizardChecks(t: VTFull): WizardCheck[] {
  return [
    { label: "Name + description", done: !!t.name?.trim() && !!(t.description ?? "").trim(), sectionIdx: 1 },
    { label: "Tone + perspective", done: !!(t.tone ?? "").trim() && !!(t.perspective ?? "").trim(), sectionIdx: 2 },
    { label: "Target audience", done: !!(t.target_audience ?? "").trim(), sectionIdx: 3 },
    { label: "Writing style", done: !!(t.writing_style ?? "").trim(), sectionIdx: 5 },
    { label: "≥ 3 banned words", done: (t.banned_words ?? []).length >= 3, sectionIdx: 6 },
    { label: "≥ 2 opening examples", done: (t.opening_examples ?? []).length >= 2, sectionIdx: 4 },
    { label: "Content rules", done: !!(t.content_rules ?? "").trim(), sectionIdx: 8 },
    { label: "SEO guidelines", done: !!(t.seo_guidelines ?? "").trim(), sectionIdx: 9 },
    { label: "Calibration sentence ≥ 30 chars", done: (t.calibration_sentence ?? "").trim().length >= 30, sectionIdx: 10 },
    { label: "≥ 2 signature phrases", done: (t.signature_phrases ?? []).length >= 2, sectionIdx: 10 },
    { label: "≥ 1 watch-out", done: (t.watch_outs ?? []).length >= 1, sectionIdx: 10 },
  ];
}

function CompletionWizard({ template }: { template: VTFull | null }) {
  if (!template) return null;
  const checks = buildWizardChecks(template);
  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);
  const nextGap = checks.find((c) => !c.done);

  const jump = (idx: number) => {
    document.getElementById(`vt-sec-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside
      className="hidden xl:flex flex-col gap-3 fixed right-6 top-28 w-[230px] p-4 rounded-lg border border-border/60 z-40"
      style={{ background: "hsl(var(--card) / 0.92)", backdropFilter: "blur(6px)" }}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Completeness</span>
        <span className={`text-[18px] font-semibold ${pct >= 70 ? "text-primary" : "text-amber-500"}`}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 70 ? "bg-primary" : "bg-amber-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="flex flex-col gap-1 mt-1">
        {checks.map((c) => (
          <li key={c.label}>
            <button
              onClick={() => jump(c.sectionIdx)}
              className={`flex items-center gap-2 w-full text-left text-[11.5px] py-0.5 rounded hover:bg-border/30 ${
                c.done ? "text-muted-foreground line-through decoration-border" : "text-foreground"
              }`}
            >
              {c.done ? (
                <Check size={11} className="text-primary shrink-0" strokeWidth={2.5} />
              ) : (
                <span className="w-[11px] h-[11px] rounded-full border border-amber-500 shrink-0" />
              )}
              {c.label}
            </button>
          </li>
        ))}
      </ul>
      {nextGap ? (
        <button
          onClick={() => jump(nextGap.sectionIdx)}
          className="mt-1 text-[11.5px] font-medium px-3 py-2 rounded border border-amber-500/60 text-amber-600 hover:bg-amber-500/10 text-left"
        >
          Next gap → {nextGap.label}
        </button>
      ) : (
        <div className="mt-1 text-[11.5px] font-medium px-3 py-2 rounded border border-primary/50 text-primary">
          Voice DNA compleet ✓
        </div>
      )}
      {pct < 70 && (
        <p className="text-[10.5px] text-muted-foreground leading-snug">
          Onder 70% schrijft de ghost-writer met een onvolledige stem — vul eerst de gaten.
        </p>
      )}
    </aside>
  );
}


// ─── Google Ads audience picker (design contract #17) ─────────────────────
const AUDIENCE_SEP = "; ";

const FIND_TOPICS = ["Amazon NL", "Bol.com", "Marketplace strategie", "E-commerce UX", "AI in e-commerce", "Advertising/PPC", "Logistiek/fulfilment", "Conversie/CRO", "Internationale expansie"];
const FIND_GOALS = ["Leads voor advisory", "Merkautoriteit", "Bereik nieuwe sellers", "Bestaande klanten binden", "Recruitment/employer brand", "Productlaunch"];

function AudiencePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [tab, setTab] = useState<"browse" | "find">("browse");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof AUDIENCE_CATEGORIES)[number] | "All">("All");
  const [findTopic, setFindTopic] = useState<string | null>(null);
  const [findGoal, setFindGoal] = useState<string | null>(null);
  const [findBusy, setFindBusy] = useState(false);
  const [findPicks, setFindPicks] = useState<string[]>([]);
  const [findErr, setFindErr] = useState<string | null>(null);

  const runFind = async () => {
    if (!findTopic || !findGoal) return;
    setFindBusy(true); setFindErr(null); setFindPicks([]);
    try {
      const { data, error } = await supabase.functions.invoke("claude-proxy", {
        body: { model: "claude-haiku-4-5-20251001", max_tokens: 500, messages: [{ role: "user", content: `Geef 6 concrete Google Ads audience-segmenten voor Hans van Leeuwen (NL e-commerce). Topic: ${findTopic}. Doel: ${findGoal}. Reply met ALLEEN een JSON-array van 6 korte strings, geen markdown.` }] },
      });
      if (error) throw new Error(error.message);
      const txt = (data as { content?: { text?: string }[] })?.content?.[0]?.text ?? "[]";
      const cleaned = txt.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
      const arr = JSON.parse(cleaned);
      setFindPicks(Array.isArray(arr) ? arr.map(String).slice(0, 6) : []);
    } catch (e) {
      setFindErr(e instanceof Error ? e.message : "Generatie mislukt");
    } finally { setFindBusy(false); }
  };

  const selected = useMemo(
    () => value.split(AUDIENCE_SEP).map((s) => s.trim()).filter(Boolean),
    [value],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ADS_AUDIENCES.filter(
      (a) =>
        (cat === "All" || a.category === cat) &&
        (!q || a.label.toLowerCase().includes(q)) &&
        !selected.includes(a.label),
    ).slice(0, 14);
  }, [query, cat, selected]);

  const add = (label: string) => onChange([...selected, label].join(AUDIENCE_SEP));
  const remove = (label: string) => onChange(selected.filter((x) => x !== label).join(AUDIENCE_SEP));

  return (
    <div className="flex flex-col gap-3">
      {/* Selected chips */}
      <div className="flex gap-2 flex-wrap">
        {selected.length === 0 && (
          <span className="text-[12px] text-muted-foreground italic">Nog geen audiences geselecteerd — zoek hieronder of typ vrij in het tekstveld.</span>
        )}
        {selected.map((it) => (
          <div
            key={it}
            className="flex items-center gap-2 px-3 py-2 rounded border border-primary/50 text-[12.5px]"
            style={{ background: "hsl(var(--primary) / 0.08)" }}
          >
            <span>{it}</span>
            <button onClick={() => remove(it)} className="text-muted-foreground hover:text-foreground">
              <X size={11} />
            </button>
          </div>
        ))}
      </div>

      {/* Browse / Find tabs */}
      <div className="flex gap-2">
        {(["browse", "find"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded text-[11px] uppercase tracking-wider border ${tab === t ? "border-primary text-primary bg-primary/10" : "border-border/60 text-muted-foreground"}`}>
            {t === "browse" ? "Browse Google Ads" : "✦ Find for me"}
          </button>
        ))}
      </div>

      {tab === "find" && (
        <div className="flex flex-col gap-3 border border-border/60 rounded-lg p-4" style={{ background: "hsl(var(--card) / 0.4)" }}>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">01 · Topic</div>
            <div className="flex gap-1.5 flex-wrap">
              {FIND_TOPICS.map((t) => (
                <button key={t} onClick={() => setFindTopic(t)} className={`px-2.5 py-1 rounded text-[11.5px] border ${findTopic === t ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">02 · Doel</div>
            <div className="flex gap-1.5 flex-wrap">
              {FIND_GOALS.map((g) => (
                <button key={g} onClick={() => setFindGoal(g)} className={`px-2.5 py-1 rounded text-[11.5px] border ${findGoal === g ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"}`}>{g}</button>
              ))}
            </div>
          </div>
          <Button size="sm" onClick={runFind} disabled={!findTopic || !findGoal || findBusy} className="gap-2 w-fit">
            <Sparkles size={13} /> {findBusy ? "Genereren…" : "Generate audiences"}
          </Button>
          {findErr && <div className="text-[11px] text-red-500">{findErr}</div>}
          {findPicks.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {findPicks.map((p) => (
                <button key={p} onClick={() => { if (!selected.includes(p)) onChange([...selected, p].join(AUDIENCE_SEP)); }}
                  className="flex items-center gap-2 px-3 py-2 rounded border border-dashed border-primary/60 text-[12px] hover:bg-primary/5 text-left">
                  <Check size={12} className="text-primary shrink-0" />{p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "browse" && <>
      {/* Category tabs + search */}
      <div className="flex gap-2 flex-wrap items-center">
        {(["All", ...AUDIENCE_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c as typeof cat)}
            className={`px-2.5 py-1 rounded text-[11px] uppercase tracking-wider border transition-colors ${
              cat === c
                ? "border-primary text-primary bg-primary/10"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
        <input
          className="input-base flex-1 min-w-[180px]"
          placeholder="Zoek audiences… (bv. 'amazon', 'MKB', 'in-market')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Results */}
      <div className="flex gap-2 flex-wrap">
        {results.map((a) => (
          <button
            key={a.label}
            onClick={() => add(a.label)}
            className="flex items-center gap-2 px-3 py-2 rounded border border-border/60 text-[12px] hover:border-primary/60 hover:bg-primary/5 text-left"
            title={`${a.category} — klik om toe te voegen`}
          >
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{a.category}</span>
            {a.label}
          </button>
        ))}
        {results.length === 0 && (
          <span className="text-[12px] text-muted-foreground">Geen matches — pas je zoekterm of categorie aan.</span>
        )}
      </div>

      </>}

      {/* Free text fallback (stays the source of truth) */}
      <Field label="target_audience (vrije tekst — picker schrijft hierin)">
        <textarea
          className="input-base"
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="bv. Nederlandse MKB-verkopers op Bol.com en Amazon.nl; e-commerce managers; founders"
        />
      </Field>
    </div>
  );
}


// ─── Sample analyzer — writing sample → template suggestions (design contract #18)
interface Suggestion { value: unknown; confidence: number }
type SuggestionMap = Record<string, Suggestion>;

const SUGGESTION_FIELDS: { key: keyof VTFull; label: string; isArray: boolean }[] = [
  { key: "tone", label: "Tone", isArray: false },
  { key: "perspective", label: "Perspective", isArray: false },
  { key: "writing_style", label: "Writing style", isArray: false },
  { key: "calibration_sentence", label: "Calibration sentence", isArray: false },
  { key: "signature_phrases", label: "Signature phrases", isArray: true },
  { key: "strengths", label: "Strengths", isArray: true },
  { key: "watch_outs", label: "Watch-outs", isArray: true },
  { key: "unique_markers", label: "Unique markers", isArray: true },
  { key: "opening_examples", label: "Opening examples", isArray: true },
];

function SampleAnalyzer({ onApply, current }: { onApply: (u: Partial<VTFull>) => void; current: VTFull }) {
  const [sample, setSample] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionMap | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => setSample(String(reader.result ?? "").slice(0, 20000));
    reader.readAsText(f);
  };

  const analyze = async () => {
    setBusy(true);
    setError(null);
    setSuggestions(null);
    setApplied(new Set());
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("blog-youtube-analyze", {
        body: { action: "voice_extract", text: sample },
      });
      if (fnErr) throw new Error(fnErr.message);
      const d = data as { suggestions?: SuggestionMap; error?: string };
      if (d.error) throw new Error(d.error);
      if (!d.suggestions) throw new Error("Geen suggesties ontvangen");
      setSuggestions(d.suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse mislukt");
    } finally {
      setBusy(false);
    }
  };

  const applyOne = (key: keyof VTFull) => {
    if (!suggestions) return;
    const sug = suggestions[key as string];
    if (!sug) return;
    const def = SUGGESTION_FIELDS.find((f) => f.key === key);
    const value = def?.isArray
      ? (Array.isArray(sug.value) ? (sug.value as unknown[]).map(String) : [])
      : String(sug.value ?? "");
    onApply({ [key]: value } as Partial<VTFull>);
    setApplied((prev) => new Set(prev).add(key as string));
  };

  const applyAll = () => SUGGESTION_FIELDS.forEach((f) => suggestions?.[f.key as string] && applyOne(f.key));

  return (
    <div className="flex flex-col gap-3">
      <textarea
        className="input-base font-mono text-[12px]"
        rows={5}
        value={sample}
        onChange={(e) => setSample(e.target.value.slice(0, 20000))}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) readFile(f);
        }}
        onDragOver={(e) => e.preventDefault()}
        placeholder="Plak hier een representatief stuk eigen tekst (min. 200 tekens), of sleep een .txt/.md bestand hierheen…"
      />
      <div className="flex items-center gap-3">
        <Button onClick={analyze} disabled={busy || sample.trim().length < 200} className="gap-2">
          <Wand2 size={14} />
          {busy ? "Analyzing…" : "Analyze sample"}
        </Button>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-[12px] text-muted-foreground hover:text-foreground underline"
        >
          of kies bestand (.txt/.md)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.markdown,text/plain,text/markdown"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
        />
        <span className="text-[11px] text-muted-foreground ml-auto font-mono">{sample.length}/20000</span>
      </div>

      {error && <div className="text-[12px] text-red-500">{error}</div>}

      {suggestions && (
        <div className="flex flex-col gap-2 border border-border/60 rounded-lg p-4" style={{ background: "hsl(var(--card) / 0.4)" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Suggesties</span>
            <Button size="sm" variant="outline" onClick={applyAll} className="gap-1.5">
              <Check size={12} /> Apply all
            </Button>
          </div>
          {SUGGESTION_FIELDS.map((f) => {
            const sug = suggestions[f.key as string];
            if (!sug) return null;
            const display = Array.isArray(sug.value) ? (sug.value as unknown[]).map(String).join(" · ") : String(sug.value ?? "");
            const conf = Number(sug.confidence ?? 0);
            const isApplied = applied.has(f.key as string);
            return (
              <div key={f.key as string} className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.label}</span>
                  <span className="text-[12.5px] leading-snug break-words">{display || "—"}</span>
                </div>
                <span
                  className={`font-mono text-[11px] shrink-0 mt-0.5 ${conf >= 75 ? "text-primary" : conf >= 50 ? "text-amber-500" : "text-muted-foreground"}`}
                  title="Confidence"
                >
                  {conf}%
                </span>
                <Button
                  size="sm"
                  variant={isApplied ? "secondary" : "outline"}
                  disabled={isApplied}
                  onClick={() => applyOne(f.key)}
                  className="shrink-0"
                >
                  {isApplied ? <Check size={12} /> : "Apply"}
                </Button>
              </div>
            );
          })}
          <p className="text-[10.5px] text-muted-foreground mt-1">
            Apply zet de suggestie in het formulier — controleer en klik daarna zelf op Save template.
          </p>
        </div>
      )}
    </div>
  );
}
