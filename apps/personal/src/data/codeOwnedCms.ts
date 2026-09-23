/**
 * CMS-sleutels (page_content) die sinds de positionering van 2026-09-24 code-eigendom zijn.
 * Hero/About negeren een CMS-rij voor deze sleutels, zodat oude CMS-tekst de nieuwe copy na het
 * laden niet terugzet en prerender (zonder CMS) en browser dezelfde tekst tonen.
 * Opruimen van de bijbehorende CMS-rijen: docs/growth-2026-09-24/CMS-PATCHES-POSITIONERING.md.
 */
/** CMS-sleutels van de homepage die niet meer uit page_content mogen komen (zie getValue in Hero). */
export const HOME_CODE_OWNED_KEYS: ReadonlySet<string> = new Set([
  "hero_subtitle",
  "hero_heading_emphasis",
  "hero_description",
  "hero_cta_consult",
  "hero_cta_work",
  "expertise_label",
  "expertise_heading",
  "expertise_1_title",
  "expertise_1_desc",
  "expertise_2_title",
  "expertise_2_desc",
  "expertise_3_title",
  "expertise_3_desc",
  "expertise_4_title",
  "expertise_4_desc",
]);

/** CMS-sleutels van /about die sinds de positionering van 2026-09-24 uit code komen. */
export const ABOUT_CODE_OWNED_KEYS: ReadonlySet<string> = new Set(["about_h1", "about_bio_1", "about_bio_2", "about_methodology_intro"]);
