import { WORKFLOWS, type WorkflowDef } from "@/lib/config/workflows";

export interface RouteResult {
  workflow: WorkflowDef | null;
  confidence: number;
  method: "exact" | "keyword" | "llm" | "clarify";
  alternatives?: WorkflowDef[];
}

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "i", "me", "my", "we", "our", "you", "your", "it", "its", "he",
  "she", "they", "them", "this", "that", "these", "those", "and",
  "but", "or", "nor", "not", "so", "yet", "for", "of", "in", "on",
  "at", "to", "by", "with", "from", "up", "about", "into", "through",
  "please", "run", "start", "launch", "trigger", "execute", "go",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function scoreWorkflow(tokens: string[], wf: WorkflowDef): number {
  if (tokens.length === 0) return 0;

  let score = 0;
  const inputJoined = tokens.join(" ");

  // Exact name/label match → highest score
  if (inputJoined === wf.name || inputJoined === wf.label.toLowerCase()) {
    return 1.0;
  }

  // Partial name match (input contains the workflow name)
  if (inputJoined.includes(wf.name)) {
    score = Math.max(score, 0.9);
  }

  // Keyword overlap: how many of the workflow's keywords appear in the input
  const keywordHits = wf.keywords.filter((kw) =>
    tokens.some((t) => t === kw || kw.includes(t) || t.includes(kw)),
  ).length;
  const keywordScore = keywordHits / Math.max(wf.keywords.length, 1);
  score = Math.max(score, keywordScore);

  // Example similarity: check if any example is a close match
  for (const example of wf.examples) {
    const exTokens = tokenize(example);
    if (exTokens.length === 0) continue;
    const overlap = exTokens.filter((et) =>
      tokens.some((t) => t === et || et.includes(t) || t.includes(et)),
    ).length;
    const exScore = overlap / Math.max(exTokens.length, 1);
    score = Math.max(score, exScore * 0.95);
  }

  return score;
}

/**
 * Fast keyword-based intent router. Zero latency, no LLM needed.
 *
 * Returns:
 * - confidence >= 0.85 → route directly
 * - confidence 0.5–0.85 → alternatives for clarification
 * - confidence < 0.5 → null (needs LLM fallback)
 */
export function fastRoute(input: string): RouteResult {
  const tokens = tokenize(input);
  if (tokens.length === 0) {
    return { workflow: null, confidence: 0, method: "keyword" };
  }

  const scored = WORKFLOWS.map((wf) => ({
    wf,
    score: scoreWorkflow(tokens, wf),
  })).sort((a, b) => b.score - a.score);

  const best = scored[0];

  if (best.score >= 0.85) {
    return {
      workflow: best.wf,
      confidence: best.score,
      method: best.score >= 1.0 ? "exact" : "keyword",
    };
  }

  if (best.score >= 0.5) {
    const alternatives = scored
      .filter((s) => s.score >= 0.3)
      .slice(0, 10)
      .map((s) => s.wf);
    return {
      workflow: best.wf,
      confidence: best.score,
      method: "clarify",
      alternatives,
    };
  }

  return { workflow: null, confidence: best.score, method: "keyword" };
}
