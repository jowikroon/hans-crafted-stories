/**
 * Resolve an on-page text edit to an exact source patch.
 *
 * Input: the selected element, its original text (as the source renders it,
 * i.e. before any runtime override) and the new text. Output: which literal
 * in which file must change, as a raw find/replace pair that the write-back
 * worker applies to the file on GitHub. Anything ambiguous or not encodable is
 * returned as "unresolved" with a reason — the overlay then only keeps the
 * runtime override and flags the edit for manual follow-up.
 */
import { diffRange, patchPartRaw, type EditSourceMap, type SourcePart } from "./codec";

export const REPO_SRC_PREFIX = "apps/personal/src/";

export interface TextSegment {
  node: Text;
  /** text as the source renders it (override-free) */
  text: string;
  start: number;
  end: number;
}

export interface GithubPatch {
  kind: "github";
  file: string;
  line: number;
  find: string;
  replace: string;
  old_value: string;
  new_value: string;
}

export interface Unresolved {
  kind: "unresolved";
  reason: string;
  candidates?: { file: string; line: number }[];
}

export type Resolution =
  | { status: "noop" }
  | { status: "resolved"; patch: GithubPatch; owner: string | null; segment: TextSegment; a: number; b: number; insert: string }
  | { status: "unresolved"; patch: Unresolved; owner: string | null; segment?: TextSegment; a?: number; b?: number; insert?: string };

const UI_ATTR = "data-edit-ui";

/** Text nodes under `el` in document order, with their source-rendered text. */
export function collectSegments(el: Element, originalOf: (t: Text) => string | undefined): TextSegment[] {
  const out: TextSegment[] = [];
  const doc = el.ownerDocument || document;
  const walker = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */);
  let pos = 0;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    if (n.parentElement?.closest(`[${UI_ATTR}]`)) continue;
    const tag = n.parentElement?.tagName;
    if (tag === "SCRIPT" || tag === "STYLE") continue;
    const text = originalOf(n) ?? n.data;
    out.push({ node: n, text, start: pos, end: pos + text.length });
    pos += text.length;
  }
  return out;
}

export function fullText(segs: TextSegment[]): string {
  return segs.map((s) => s.text).join("");
}

function fileOfKey(key: string): string {
  // "components/Hero.tsx:57:11" -> "components/Hero.tsx"
  return key.replace(/:\d+:\d+$/, "");
}

function lineOfKey(key: string): number {
  const m = /:(\d+):\d+$/.exec(key);
  return m ? Number(m[1]) : 0;
}

/** Nearest element (the text node's parent or an ancestor) carrying data-src. */
function ownerOf(node: Node): Element | null {
  const el = node.parentElement?.closest("[data-src]");
  return el ?? null;
}

/** Pick the segment that owns the edit range; null if it spans several. */
function segmentFor(segs: TextSegment[], p: number, oldEnd: number): TextSegment | null | "multi" {
  if (!segs.length) return null;
  if (oldEnd > p) {
    const hit = segs.filter((s) => s.end > p && s.start < oldEnd);
    return hit.length === 1 ? hit[0] : hit.length > 1 ? "multi" : null;
  }
  // pure insertion at p: prefer the segment that contains p, else the one ending at p
  const inside = segs.find((s) => s.start < p && p < s.end);
  if (inside) return inside;
  const ending = segs.find((s) => s.end === p && s.text.length > 0);
  if (ending) return ending;
  return segs.find((s) => s.start === p) ?? null;
}

interface Candidate {
  part: SourcePart;
  file: string; // relative to src/
}

export interface ResolveInput {
  el: Element;
  segments: TextSegment[];
  /** new text for the whole element (untrimmed, same frame as fullText(segments)) */
  newFull: string;
  map: EditSourceMap | null;
  lang: string;
}

export function resolveTextEdit({ el, segments, newFull, map, lang }: ResolveInput): Resolution {
  const oldFull = fullText(segments);
  const { p, oldEnd, newEnd } = diffRange(oldFull, newFull);
  if (p === oldEnd && p === newEnd) return { status: "noop" };
  const insert = newFull.slice(p, newEnd);

  const seg = segmentFor(segments, p, oldEnd);
  if (seg === "multi") {
    return { status: "unresolved", owner: null, patch: { kind: "unresolved", reason: "De wijziging raakt meerdere tekstdelen (bijv. een woord met andere opmaak). Bewerk ze los van elkaar." } };
  }
  if (!seg) return { status: "unresolved", owner: null, patch: { kind: "unresolved", reason: "Geen tekst gevonden in dit element." } };
  const a = p - seg.start;
  const b = oldEnd - seg.start;
  const base = { segment: seg, a, b, insert };

  if (!map) return { status: "unresolved", owner: null, ...base, patch: { kind: "unresolved", reason: "Bronkaart (/__edit/source-map.json) niet geladen." } };

  const owner = ownerOf(seg.node);
  const ownerKey = owner?.getAttribute("data-src") ?? null;

  let candidates: Candidate[] = [];
  if (ownerKey && map.elements[ownerKey]) {
    candidates = map.elements[ownerKey].filter((pt) => pt.v === seg.text).map((pt) => ({ part: pt, file: fileOfKey(ownerKey) }));
  }
  let fromLiterals = false;
  if (!candidates.length && map.literals[seg.text]) {
    fromLiterals = true;
    candidates = map.literals[seg.text].map((pt) => ({ part: pt, file: pt.f! }));
  }
  if (!candidates.length) {
    return {
      status: "unresolved",
      owner: ownerKey,
      ...base,
      patch: { kind: "unresolved", reason: "Deze tekst komt niet letterlijk uit de broncode (berekend of uit een database/CMS)." },
    };
  }

  if (candidates.length > 1 && !fromLiterals && owner) {
    // Evidence: lines of sibling text parts that match uniquely, and of nested tagged elements.
    const evidence: number[] = [];
    const ownParts = map.elements[ownerKey!] || [];
    for (const s of segments) {
      if (s === seg || ownerOf(s.node) !== owner) continue;
      const m = ownParts.filter((pt) => pt.v === s.text);
      if (m.length === 1) evidence.push(m[0].l);
    }
    owner.querySelectorAll("[data-src]").forEach((d) => {
      const k = d.getAttribute("data-src")!;
      if (fileOfKey(k) === fileOfKey(ownerKey!)) evidence.push(lineOfKey(k));
    });
    if (evidence.length) {
      const dist = (c: Candidate) => Math.min(...evidence.map((e) => Math.abs(c.part.l - e)));
      const best = Math.min(...candidates.map(dist));
      candidates = candidates.filter((c) => dist(c) === best);
    }
  }
  if (candidates.length > 1 && fromLiterals) {
    const byLang = candidates.filter((c) => c.part.g === lang);
    if (byLang.length) candidates = byLang;
    if (candidates.length > 1) {
      const neutral = candidates.filter((c) => !c.part.g);
      if (neutral.length === 1) candidates = neutral;
    }
  }
  if (candidates.length !== 1) {
    return {
      status: "unresolved",
      owner: ownerKey,
      ...base,
      patch: {
        kind: "unresolved",
        reason: `Tekst staat op ${candidates.length} plekken in de broncode; niet eenduidig welke bedoeld is.`,
        candidates: candidates.map((c) => ({ file: REPO_SRC_PREFIX + c.file, line: c.part.l })),
      },
    };
  }

  const { part, file } = candidates[0];
  const replace = patchPartRaw(part, a, b, insert);
  if (replace == null) {
    return { status: "unresolved", owner: ownerKey, ...base, patch: { kind: "unresolved", reason: "Kan de nieuwe tekst niet veilig in de bron coderen." } };
  }
  return {
    status: "resolved",
    owner: ownerKey,
    ...base,
    patch: {
      kind: "github",
      file: REPO_SRC_PREFIX + file,
      line: part.l,
      find: part.raw,
      replace,
      old_value: part.v,
      new_value: part.v.slice(0, a) + insert + part.v.slice(b),
    },
  };
}

/**
 * Apply `next` to the element's text nodes without destroying inline markup
 * (<em>, <a>, icons): only the text node(s) covering the changed range are
 * touched. Returns false when the element has no text nodes.
 */
export function applyTextPreservingMarkup(el: Element, next: string): boolean {
  const segs = collectSegments(el, (t) => t.data); // current DOM state
  if (!segs.length) return false;
  const cur = fullText(segs);
  if (cur === next) return true;
  const { p, oldEnd, newEnd } = diffRange(cur, next);
  const insert = next.slice(p, newEnd);
  const hit = segs.filter((s) => s.end > p && s.start < oldEnd);
  const target = hit[0] ?? segs.find((s) => s.start <= p && p <= s.end) ?? segs[segs.length - 1];
  // first affected node receives the insert; other affected nodes lose their covered text
  let inserted = false;
  for (const s of hit.length ? hit : [target]) {
    const a = Math.max(p, s.start) - s.start;
    const b = Math.min(oldEnd, s.end) - s.start;
    const text = s.node.data;
    const piece = inserted ? "" : insert;
    inserted = true;
    const updated = text.slice(0, a) + piece + text.slice(b);
    if (updated !== text) s.node.data = updated;
  }
  return true;
}
