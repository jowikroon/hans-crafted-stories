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
export function resolvePageContentValue(
  rows: ContentRow[],
  key: string,
  lang: string,
  fallback: string,
): string {
  const wanted = lang === "en" ? key : `${key}_${lang}`;
  const row = rows.find((r) => r.content_key === wanted);
  return row?.content_value ? stripEmDash(row.content_value) : fallback;
}
