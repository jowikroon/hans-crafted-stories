// Pure parts of the site tracker, unit-tested in siteTrackerCore.test.ts.

export type TrackEvent =
  | "page_view" | "engagement" | "cta_click" | "rates_click" | "contact_form_start" | "contact_form_submit"
  | "contact_form_error" | "book_call" | "email_click" | "linkedin_click" | "download" | "outbound_click"
  | "lang_switch" | "blog_read_progress" | "blog_read_complete" | "blog_share" | "blog_toc_click"
  | "not_found" | "js_error" | "web_vital";

/** Routes that are tools or admin screens, not the public site. */
const PRIVATE = /^\/(write|dashboards|portal|samantha|bijlagen|cowork|admin|login|auth)(\/|$)|^\/__|^\/[a-z-]+\.html$/;

export function isTrackablePath(path: string): boolean {
  return !PRIVATE.test(path);
}

export function deviceClass(width: number): "mobile" | "tablet" | "desktop" {
  return width < 768 ? "mobile" : width < 1100 ? "tablet" : "desktop";
}

/**
 * What a click on this link means commercially, or null for plain internal navigation.
 * Order matters: a Calendly link is a booked call, not just an outbound click.
 */
export function classifyLink(href: string, origin: string, download = false): { event: TrackEvent; target: string } | null {
  let u: URL;
  try { u = new URL(href, origin); } catch { return null; }
  const target = u.protocol === "mailto:" ? "mailto" : `${u.host}${u.pathname}`;
  if (u.protocol === "mailto:") return { event: "email_click", target };
  if (u.protocol === "tel:") return { event: "cta_click", target: "tel" };
  const host = u.hostname.replace(/^www\./, "");
  if (host === "calendly.com" || host.endsWith(".calendly.com") || host === "cal.com") return { event: "book_call", target };
  if (host === "linkedin.com" || host.endsWith(".linkedin.com") || host === "lnkd.in") return { event: "linkedin_click", target };
  if (download || /\.(pdf|docx?|pptx?|xlsx?|zip)$/i.test(u.pathname)) return { event: "download", target };
  const own = u.origin === origin || host === new URL(origin).hostname.replace(/^www\./, "");
  if (!own) return /^https?:$/.test(u.protocol) ? { event: "outbound_click", target } : null;
  if (u.hash === "#contact") return { event: "cta_click", target: `${u.pathname}#contact` };
  if (/^\/(nl\/)?(rates|tarieven)\/?$/.test(u.pathname)) return { event: "rates_click", target: u.pathname };
  return null;
}
