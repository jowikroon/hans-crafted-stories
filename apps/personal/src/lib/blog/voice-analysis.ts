// apps/personal/src/lib/blog/voice-analysis.ts
// Heuristic-based voice analysis — scores markdown against a voice template.
// v1: pure client-side, no AI call. Good enough to ship. Tune the heuristics
// as we gather real writing samples; upgrade to an LLM-backed scorer when the
// `blog-ai-assist` edge function is live.

export interface VoiceTemplate {
  id: string;
  name: string;
  formality: number;
  humor: number;
  respectfulness: number;
  enthusiasm: number;
  target_reading_level: number;
  max_sentence_words: number;
  passive_voice_max_pct: number;
  avg_paragraph_sentences: number;
  writing_style_rules: Record<string, boolean>;
  banned_words: string[];
  preferred_terms: string[];
}

export interface VoiceAnalysis {
  formality: number; // 0–10
  humor: number; // 0–10
  respectfulness: number; // 0–10
  enthusiasm: number; // 0–10
  match_score: number; // 0–100 (distance to template target)
  readability: {
    grade: number; // Flesch–Kincaid grade
    words: number;
    sentences: number;
    avg_sentence_length: number;
    read_minutes: number;
  };
  violations: {
    banned_word_hits: string[];
    sentences_over_limit: number;
  };
}

// Strip markdown syntax before counting — fences, images, links, headings,
// list markers, blockquote markers, emphasis.
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → link text only
    .replace(/\[\[([^\]]+)\]\]/g, "$1") // wiki links → label only
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/^[>\-*+]\s+/gm, "") // list/quote markers
    .replace(/^\d+\.\s+/gm, "") // numbered list markers
    .replace(/[*_~]+/g, "") // emphasis/strike
    .replace(/\s+/g, " ")
    .trim();
}

function countSyllables(word: string): number {
  // Crude but consistent — strip trailing "e", count vowel groups.
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const stripped = w.replace(/e$/, "");
  const groups = stripped.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function words(text: string): string[] {
  return text.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
}

// ─── Axis scorers (0–10) ──────────────────────────────────────────────────

// FORMALITY: higher = more formal. Longer sentences, Latinate words,
// low first-person, no contractions → formal.
function scoreFormality(text: string, ws: string[], sents: string[]): number {
  const avgLen = ws.length / Math.max(1, sents.length);
  const contractions = (text.match(/\b\w+'(s|t|re|ve|ll|d|m)\b/gi) ?? []).length;
  const firstPerson = (text.match(/\b(I|me|my|we|our)\b/g) ?? []).length;
  const contractionRate = contractions / Math.max(1, ws.length);
  const firstPersonRate = firstPerson / Math.max(1, ws.length);

  // Base 5; push up for long sentences, push down for contractions + I/me
  let score = 5;
  if (avgLen > 22) score += 2;
  else if (avgLen > 18) score += 1;
  else if (avgLen < 12) score -= 2;
  else if (avgLen < 15) score -= 1;

  if (contractionRate > 0.02) score -= 1.5;
  if (firstPersonRate > 0.04) score -= 1.5;
  if (firstPersonRate > 0.08) score -= 1.5;

  // Signals of formality
  if (/\b(therefore|moreover|furthermore|however|consequently|nevertheless)\b/i.test(text))
    score += 1;
  if (/\b(methodology|framework|analysis|hypothesis|paradigm)\b/i.test(text)) score += 0.5;

  return clamp(score, 0, 10);
}

// HUMOR: playful markers — exclamations, jokes, winks, parentheticals with jokes.
function scoreHumor(text: string, ws: string[]): number {
  const exclaim = (text.match(/!/g) ?? []).length;
  const parens = (text.match(/\([^)]{8,60}\)/g) ?? []).length;
  const playful = (
    text.match(/\b(obviously|frankly|whatever|spoiler|lol|honestly|funny enough)\b/gi) ?? []
  ).length;
  const wc = Math.max(1, ws.length);

  let score = 2; // default: mostly serious
  score += (exclaim / wc) * 1000 * 0.3;
  score += (parens / wc) * 1000 * 0.15;
  score += (playful / wc) * 1000 * 0.5;

  return clamp(score, 0, 10);
}

// RESPECTFULNESS: credits others, avoids personal attacks, uses measured language.
function scoreRespectfulness(text: string, ws: string[]): number {
  const credits = (
    text.match(
      /\b(according to|as .+? notes|cited|source:|via |thanks to|credit to|based on .+?'s)\b/gi
    ) ?? []
  ).length;
  const dismissive = (
    text.match(/\b(stupid|idiotic|moronic|garbage|trash|pathetic|clueless|amateur hour)\b/gi) ?? []
  ).length;
  const hedges = (text.match(/\b(perhaps|maybe|it seems|arguably|in my view)\b/gi) ?? []).length;
  const wc = Math.max(1, ws.length);

  let score = 6;
  score += (credits / wc) * 1000 * 0.5;
  score += (hedges / wc) * 1000 * 0.1;
  score -= (dismissive / wc) * 1000 * 2;

  return clamp(score, 0, 10);
}

// ENTHUSIASM: exclamations, intensifiers, superlatives.
function scoreEnthusiasm(text: string, ws: string[]): number {
  const intensifiers = (
    text.match(/\b(incredibly|absolutely|amazingly|brilliantly|stunning|remarkable|truly)\b/gi) ??
    []
  ).length;
  const exclaim = (text.match(/!/g) ?? []).length;
  const superlatives = (text.match(/\b(the best|the worst|the most|the only|never|always)\b/gi) ?? [])
    .length;
  const wc = Math.max(1, ws.length);

  let score = 3;
  score += (intensifiers / wc) * 1000 * 0.4;
  score += (exclaim / wc) * 1000 * 0.3;
  score += (superlatives / wc) * 1000 * 0.1;

  return clamp(score, 0, 10);
}

// ─── Main analyzer ────────────────────────────────────────────────────────

export function analyzeVoice(markdown: string, template: VoiceTemplate): VoiceAnalysis {
  const text = stripMarkdown(markdown);
  const ws = words(text);
  const sents = splitSentences(text);
  const syllables = ws.reduce((acc, w) => acc + countSyllables(w), 0);

  const avgSentenceLength = ws.length / Math.max(1, sents.length);
  // Flesch–Kincaid Grade Level
  const fkGrade =
    0.39 * (ws.length / Math.max(1, sents.length)) +
    11.8 * (syllables / Math.max(1, ws.length)) -
    15.59;

  const axes = {
    formality: scoreFormality(text, ws, sents),
    humor: scoreHumor(text, ws),
    respectfulness: scoreRespectfulness(text, ws),
    enthusiasm: scoreEnthusiasm(text, ws),
  };

  // Distance to target (Euclidean, normalized → match %)
  const target = [
    template.formality,
    template.humor,
    template.respectfulness,
    template.enthusiasm,
  ];
  const actual = [axes.formality, axes.humor, axes.respectfulness, axes.enthusiasm];
  const sumSquares = target.reduce((acc, t, i) => acc + (t - actual[i]) ** 2, 0);
  const distance = Math.sqrt(sumSquares); // 0 = perfect, max ≈ 20
  const match = clamp(100 - (distance / 20) * 100, 0, 100);

  // Violations
  const lcText = text.toLowerCase();
  const banned_word_hits = template.banned_words.filter((w) => lcText.includes(w.toLowerCase()));
  const sentences_over_limit = sents.filter(
    (s) => s.split(/\s+/).length > template.max_sentence_words
  ).length;

  return {
    ...axes,
    match_score: Math.round(match),
    readability: {
      grade: Math.max(0, parseFloat(fkGrade.toFixed(1))),
      words: ws.length,
      sentences: sents.length,
      avg_sentence_length: parseFloat(avgSentenceLength.toFixed(1)),
      read_minutes: Math.max(1, Math.ceil(ws.length / 230)),
    },
    violations: {
      banned_word_hits,
      sentences_over_limit,
    },
  };
}

// ─── Completeness scoring (article-level) ─────────────────────────────────

export interface CompletenessInput {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  primary_keyword?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  tags: string[];
  cover_image_url?: string | null;
}

export function computeCompleteness(a: CompletenessInput): number {
  const checks: boolean[] = [
    !!a.title && a.title.length >= 20,
    !!a.slug,
    !!a.excerpt && a.excerpt.length >= 40,
    words(stripMarkdown(a.content)).length >= 800,
    !!a.primary_keyword,
    !!a.meta_title && a.meta_title.length >= 40,
    !!a.meta_description && a.meta_description.length >= 120,
    a.tags.length >= 2,
    !!a.cover_image_url,
    /^#\s+/.test(a.content.trim()) || /^##\s+/m.test(a.content),
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

// ─── Outline extraction (markdown → H1/H2/H3) ─────────────────────────────

export interface OutlineItem {
  level: "H1" | "H2" | "H3";
  title: string;
  line: number;
}

export function extractOutline(markdown: string): OutlineItem[] {
  const lines = markdown.split("\n");
  const out: OutlineItem[] = [];
  let inFence = false;
  lines.forEach((line, i) => {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const m = line.match(/^(#{1,3})\s+(.+?)\s*$/);
    if (!m) return;
    const level = (["H1", "H2", "H3"] as const)[m[1].length - 1];
    out.push({ level, title: m[2].trim(), line: i });
  });
  return out;
}

// ─── utilities ────────────────────────────────────────────────────────────
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
