/**
 * Ahrefs Web Analytics: alleen op het productiedomein, alleen na toestemming
 * ("accepted" in localStorage cookie_consent) en nooit op private routes.
 * De data-key is publiek (staat in de paginabron van elke bezoeker).
 */
export const AHREFS_SRC = "https://analytics.ahrefs.com/analytics.js";
export const AHREFS_KEY = "B9nwbzyG9h9CBs8sfk5HJw";
export const CONSENT_KEY = "cookie_consent";
/** CookieConsent stuurt dit event bij een keuze, zodat laden niet op een reload wacht. */
export const CONSENT_EVENT = "hvl:consent";

const PRODUCTION_HOSTS = new Set(["hansvanleeuwen.com"]);

/** Routes die Vercel naar private.html stuurt (vercel.json rewrites), plus de werkruimtes in de app. */
const PRIVATE_PATH = /^\/(nl\/)?(portal|bijlagen|wiki|god-structure|samantha|release-set|music-cms|write|dashboards|blog-cms|auth|empire|extensions)(\/|$)/;

export type ConsentChoice = "accepted" | "declined";

export const isPrivatePath = (pathname: string): boolean => PRIVATE_PATH.test(pathname);

export function readConsent(): ConsentChoice | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null; // geblokkeerde opslag = geen toestemming
  }
}

export function shouldLoadAhrefs(opts: { hostname: string; pathname: string; consent: ConsentChoice | null }): boolean {
  return PRODUCTION_HOSTS.has(opts.hostname) && opts.consent === "accepted" && !isPrivatePath(opts.pathname);
}

export const isAhrefsLoaded = (): boolean =>
  typeof document !== "undefined" && !!document.querySelector(`script[src="${AHREFS_SRC}"]`);

/** Idempotent: voegt het script hooguit één keer toe. */
export function loadAhrefs(): void {
  if (isAhrefsLoaded()) return;
  const s = document.createElement("script");
  s.src = AHREFS_SRC;
  s.async = true;
  s.setAttribute("data-key", AHREFS_KEY);
  document.head.appendChild(s);
}

/** Vervangbaar in tests (jsdom kan niet herladen of navigeren). */
export const pageNavigator = {
  reload: (): void => window.location.reload(),
  assign: (href: string): void => window.location.assign(href),
};
