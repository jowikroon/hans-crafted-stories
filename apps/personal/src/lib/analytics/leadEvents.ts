/**
 * Lead-meting (batch 3, KPI 5 "contactconversie"). Alleen GTM-dataLayer-events;
 * consent regelt GTM/Consent Mode (index.html), net als bij blogAnalytics.ts.
 *
 * Privacy: events bevatten NOOIT formulierinhoud of persoonsgegevens — alleen
 * vaste, niet-vrije parameters (cta-id, pagina-pad, taal, uitkomst, reden-categorie).
 * Een CTA-klik is geen lead; alleen contact_form_submit met result "sent" telt
 * als bevestigde aanvraag (insert zonder error).
 *
 * Events:
 * - contact_cta_click   klik op een link naar #contact of mailto (cta_id, page_path)
 * - contact_form_start  eerste interactie met het formulier (één keer per pageview)
 * - contact_form_submit uitkomst: sent | error | invalid | preview (+ reason_category bij sent)
 */

type Primitive = string | number | boolean;
export type LeadEventName = "contact_cta_click" | "contact_form_start" | "contact_form_submit";

const ALLOWED_PARAMS = new Set(["cta_id", "page_path", "lang", "result", "reason_category", "cta_target"]);

type DL = { dataLayer?: Record<string, unknown>[] };

export function pushLeadEvent(event: LeadEventName, params: Record<string, Primitive | undefined> = {}): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const payload: Record<string, unknown> = { event };
  for (const [k, v] of Object.entries(params)) {
    // Whitelist: voorkomt dat per ongeluk naam/e-mail/bericht in analytics belandt.
    if (ALLOWED_PARAMS.has(k) && v !== undefined) payload[k] = v;
  }
  const w = window as unknown as DL;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(payload);
  return payload;
}

/** Pad zonder query/hash (geen vrije tekst of e-mailadressen via query strings in analytics). */
export const safePath = (pathname: string) => pathname.split(/[?#]/)[0];

/**
 * Eén gedelegeerde listener voor alle contact-CTA's: links naar `#contact`
 * (/about#contact, /nl/about#contact) en mailto-links. Label via data-cta,
 * anders "unlabeled" + pad, zodat nieuwe CTA's automatisch meetellen.
 */
export function installContactCtaTracking(doc: Document = document): () => void {
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.("a");
    if (!a) return;
    const href = a.getAttribute("href") ?? "";
    const isContact = /#contact$/.test(href);
    const isMail = href.startsWith("mailto:");
    if (!isContact && !isMail) return;
    pushLeadEvent("contact_cta_click", {
      cta_id: a.getAttribute("data-cta") ?? "unlabeled",
      cta_target: isMail ? "email" : "contact_form",
      page_path: safePath(doc.location?.pathname ?? ""),
      lang: doc.documentElement.lang || undefined,
    });
  };
  doc.addEventListener("click", onClick, { capture: true });
  return () => doc.removeEventListener("click", onClick, { capture: true });
}
