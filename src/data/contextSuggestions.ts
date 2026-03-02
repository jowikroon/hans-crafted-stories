import type { PrimaryGoal } from "@/lib/intent/types";

export interface SuggestionItem {
  cmd: string;
  desc: string;
}

const LAZY_ITEM: SuggestionItem = {
  cmd: "Ik ben lui jij moet alles doen",
  desc: "Laat de AI alles uitvoeren",
};

/**
 * 4 vaste suggesties per primaryGoal (slots 2–5).
 * Later uitbreidbaar met leer-/geheugenlogica per gebruiker.
 */
const GOAL_SUGGESTIONS: Record<PrimaryGoal, string[]> = {
  seo_content: [
    "Run AutoSEO",
    "Optimaliseer producttitels",
    "Toon GA4-overzicht",
    "Content-ideeën voor SEO",
  ],
  n8n_workflows: [
    "Toon workflowstatus",
    "Fix mijn n8n-workflow",
    "Maak Channable-workflow",
    "Run health check",
  ],
  data_feeds: [
    "Sync productfeed",
    "Check Channable-fouten",
    "Exporteer feed naar CSV",
    "Optimaliseer Google Shopping feed",
  ],
  campaigns: [
    "Maak een campagne",
    "Toon Google Ads resultaten",
    "Genereer ad copy",
    "Analyseer campagne-performance",
  ],
  web_scraping: [
    "Scrape concurrentprijzen",
    "Crawl een website",
    "Extraheer productdata",
    "Vergelijk competitor-pagina's",
  ],
  system_health: [
    "Run health check",
    "Check VPS status",
    "Toon Cloudflare analytics",
    "Controleer SSL-certificaten",
  ],
  general: [
    "Wat kan ik doen?",
    "Toon beschikbare workflows",
    "Geef me een taak-overzicht",
    "Help me op weg",
  ],
};

/** Admin-only 4th and 5th options (only shown when isAdmin). */
export const ADMIN_SUGGESTIONS_4_5: SuggestionItem[] = [
  { cmd: "Be more vulgar", desc: "Antwoord wat vulgairder" },
  { cmd: "Be more friendly", desc: "Antwoord vriendelijker" },
];

/**
 * Build 5 context suggestions for the given goal.
 * Item 1 is always the "lazy" option; items 2–5 from the fixed per-goal list, or for admin items 4–5 are "Be more vulgar" / "Be more friendly".
 */
export function getContextSuggestionsList(primaryGoal: PrimaryGoal, isAdmin?: boolean): SuggestionItem[] {
  const goalTexts = GOAL_SUGGESTIONS[primaryGoal] ?? GOAL_SUGGESTIONS.general;
  if (isAdmin) {
    return [
      LAZY_ITEM,
      ...goalTexts.slice(0, 2).map((text) => ({ cmd: text, desc: text })),
      ...ADMIN_SUGGESTIONS_4_5,
    ];
  }
  return [
    LAZY_ITEM,
    ...goalTexts.slice(0, 4).map((text) => ({ cmd: text, desc: text })),
  ];
}
