import type { Lang } from "@/lib/i18n/routes";

/**
 * Fallback van de taalschakelaar wanneer de huidige pagina geen versie in de
 * gekozen taal heeft (i18n-audit 2026-10-01).
 *
 *   Artikel zonder EN-versie  -> /writing?notice=only-nl&from=<pad>
 *   Artikel zonder NL-versie  -> /nl/writing?notice=only-en&from=<pad>
 *   Overige pagina's (music)  -> /  of /nl met dezelfde melding
 *
 * De bestemming is de startpagina in de gekozen taal (voor artikelen de
 * artikelenlijst); <UntranslatedNotice> leest de parameters en zegt op de pagina
 * dat de vertaling ontbreekt, met een link terug naar het origineel.
 */
export type UntranslatedNotice = "only-nl" | "only-en";

export const untranslatedFallback = (target: Lang, fromPath: string, isArticle: boolean): string => {
  const notice: UntranslatedNotice = target === "en" ? "only-nl" : "only-en";
  const home = isArticle ? (target === "nl" ? "/nl/writing" : "/writing") : target === "nl" ? "/nl" : "/";
  return `${home}?notice=${notice}&from=${encodeURIComponent(safeInternalPath(fromPath) ?? "/")}`;
};

/** Alleen interne paden (geen //host, geen schema), anders null. */
export const safeInternalPath = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  if (!/^\/[A-Za-z0-9\-._~/%]*$/.test(value)) return null;
  return value;
};

export const parseUntranslatedNotice = (
  search: string,
): { notice: UntranslatedNotice; from: string } | null => {
  const params = new URLSearchParams(search);
  const notice = params.get("notice");
  if (notice !== "only-nl" && notice !== "only-en") return null;
  const from = safeInternalPath(params.get("from"));
  if (!from) return null;
  return { notice, from };
};
