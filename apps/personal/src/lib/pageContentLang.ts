import { stripEmDash } from "@/lib/noEmDash";

interface ContentRow {
  content_key: string;
  content_value: string;
}

/**
 * Waarde voor een CMS-sleutel in de gevraagde taal.
 *
 * - EN: de basissleutel (bv. `about_h1`), anders de fallback uit de code.
 * - NL: alleen de `_nl`-sleutel (bv. `about_h1_nl`), anders de fallback uit de
 *   code. De basissleutel is Engels; die gebruiken op /nl liet Engelse koppen en
 *   knoppen op /nl/about staan terwijl de code de Nederlandse tekst al had
 *   (i18n-audit 2026-10-01: 5 sleutels op `about` zonder `_nl`-tweeling).
 */
/**
 * Taalneutrale sleutels (naam, plaats, URL's) delen één CMS-waarde over beide
 * talen; een aangepaste LinkedIn-URL of plaats mag op /nl niet terugvallen op
 * de code (Codex-review PR #387).
 */
export const LANGUAGE_NEUTRAL_KEYS: ReadonlySet<string> = new Set(["about_name", "about_location", "about_linkedin_url"]);
export const isLanguageNeutralKey = (key: string): boolean => LANGUAGE_NEUTRAL_KEYS.has(key) || /_url$/.test(key);

export function resolvePageContentValue(
  rows: ContentRow[],
  key: string,
  lang: string,
  fallback: string,
): string {
  const pick = (k: string) => rows.find((r) => r.content_key === k)?.content_value;
  if (lang === "en") {
    const v = pick(key);
    return v ? stripEmDash(v) : fallback;
  }
  const v = pick(`${key}_${lang}`) || (isLanguageNeutralKey(key) ? pick(key) : undefined);
  return v ? stripEmDash(v) : fallback;
}
