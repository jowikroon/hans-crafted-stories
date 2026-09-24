/**
 * Em dashes read as an AI mark and cost credibility (Hans, 2026-09-24), so the
 * public site never shows one.
 *
 * - Code and static files: `scripts/seo-guard.mjs` fails the build on any em
 *   dash, so they are fixed at the source.
 * - Database copy (blog posts, page_content): cleaned in the database, and this
 *   function is the last line of defence at read time for anything new.
 */
const EM = "—";
const ENTITY = /&(?:mdash|#8212|#x2014);/gi;

function hasEmDash(text: string): boolean {
  return text.indexOf(EM) !== -1 || /&(?:mdash|#8212|#x2014);/i.test(text);
}

export function stripEmDash(text: string): string;
export function stripEmDash(text: string | null | undefined): string | null | undefined;
export function stripEmDash(text: string | null | undefined): string | null | undefined {
  if (!text || !hasEmDash(text)) return text;
  return text
    .replace(ENTITY, EM)
    .replace(/(\d)[ \t]*—[ \t]*(?=\d)/g, "$1-") // number ranges get a hyphen
    .replace(/(^|\n)([ \t]*(?:[-*>]|\d+\.)?[ \t]*)—[ \t]*/g, "$1$2") // leading dash on a line
    .replace(/[ \t]*—[ \t]*(?=\n|$)/g, "") // trailing dash on a line
    .replace(/[ \t]*—[ \t]*/g, ", ") // pause or aside: comma
    .replace(/,[ \t]*([,.;:!?)])/g, "$1") // tidy ", ." and ",,"
    .replace(/\([ \t]*,[ \t]*/g, "("); // tidy "(, "
}

/** Same for selected text fields of a row (returns the same object when clean). */
export function stripEmDashFields<T extends object>(row: T, keys: readonly string[]): T {
  const rec = row as Record<string, unknown>;
  let copy: Record<string, unknown> | null = null;
  for (const key of keys) {
    const v = rec[key];
    if (typeof v === "string" && hasEmDash(v)) {
      copy ??= { ...rec };
      copy[key] = stripEmDash(v);
    }
  }
  return (copy as T) ?? row;
}
