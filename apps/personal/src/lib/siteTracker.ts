/* siteTracker: first-party, cookieless visit measurement -> Supabase site_events.

   Why it exists next to GA4: GA4 only counts visitors who accept cookies (Consent Mode denies
   everything by default for the EEA), which on this site is a small minority. This tracker
   stores nothing on the device, sends no IP, user agent or identifier beyond a random id that
   lives in memory for one tab (a reload starts a new visit), so it needs no consent and sees
   every visit. GA4 stays for what it is good at; the dashboard shows both side by side.

   What it records (see supabase/migrations/20260925120000_site_measurement.sql):
   - page_view on every route change, with referrer host, UTM tags, language and device class
   - engagement per page: visible time and max scroll depth, sent when the page is left
   - lead and intent clicks, classified from the link itself (classifyLink)
   - contact form start / submit / error (from ContactForm), 404s (from NotFound)
   - Core Web Vitals (LCP, CLS, INP, FCP, TTFB) for the landing page, with Google's ratings
   - JavaScript errors (first five per visit)

   Not tracked: admin and tool routes (/write, /dashboards, /portal, ...), bots and headless
   browsers (including the prerender build). A logged-in session is marked internal so the
   dashboard can leave Hans's own visits out. */

import { classifyLink, deviceClass, isTrackablePath, type TrackEvent } from "./siteTrackerCore";

export type { TrackEvent };

const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const FLUSH_MS = 4000;
const MAX_ERRORS = 5;

interface Row {
  visit_id: string;
  event: TrackEvent;
  path: string;
  referrer_host?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  lang?: string | null;
  device?: string | null;
  value?: number | null;
  props?: Record<string, unknown> | null;
  internal?: boolean;
}

let enabled = false;
let visitId = "";
let queue: Row[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let currentPath = "";
let firstView = true;
let visibleSince = 0;
let visibleMs = 0;
let maxScroll = 0;
let errors = 0;
let internal = false;
const attribution: Pick<Row, "referrer_host" | "utm_source" | "utm_medium" | "utm_campaign"> = {};

const clip = (v: string | null | undefined, n: number) => (v ? v.slice(0, n) : null);
const lang = () => (typeof document !== "undefined" ? document.documentElement.lang || null : null)?.slice(0, 5) ?? null;

function isBot(): boolean {
  if (typeof navigator === "undefined") return true;
  if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return true;
  return /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|prerender|preview|facebookexternalhit|embedly|quora|whatsapp|telegram/i
    .test(navigator.userAgent);
}

function hasSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? "";
      if (k.startsWith("sb-") && k.endsWith("-auth-token")) return true;
    }
  } catch { /* storage blocked: treat as a visitor */ }
  return false;
}

function send(rows: Row[], keepalive: boolean) {
  if (!URL_BASE || !KEY || rows.length === 0) return;
  try {
    void fetch(`${URL_BASE}/rest/v1/site_events`, {
      method: "POST",
      keepalive,
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    }).catch(() => { /* measurement must never break the page */ });
  } catch { /* ignore */ }
}

function flush(keepalive = false) {
  if (timer) { clearTimeout(timer); timer = null; }
  if (queue.length === 0) return;
  // keepalive bodies are capped at 64 KB; batches stay far below that, but split to be safe.
  const rows = queue;
  queue = [];
  for (let i = 0; i < rows.length; i += 40) send(rows.slice(i, i + 40), keepalive);
}

function push(event: TrackEvent, path: string, extra: Partial<Row> = {}) {
  if (!enabled) return;
  queue.push({
    visit_id: visitId, event, path: clip(path, 300) ?? "/", lang: lang(), device: deviceClass(window.innerWidth),
    internal, ...extra,
  });
  if (!timer) timer = setTimeout(() => flush(), FLUSH_MS);
}

/** The in-memory visit id, to tie a contact submission to its visit (null when not measured). */
export function currentVisitId(): string | null {
  return enabled ? visitId : null;
}

/** Public: record an event for the current page. Safe to call anywhere, also before init. */
export function track(event: TrackEvent, props?: Record<string, unknown>, value?: number) {
  if (!enabled) return;
  push(event, currentPath || location.pathname, { props: props ?? null, value: value ?? null });
  if (event === "contact_form_submit") flush(true);
}

function endEngagement() {
  if (!currentPath) return;
  if (visibleSince) { visibleMs += Date.now() - visibleSince; visibleSince = document.visibilityState === "visible" ? Date.now() : 0; }
  if (visibleMs >= 1000) push("engagement", currentPath, { value: Math.round(visibleMs), props: { scroll: Math.round(maxScroll) } });
  visibleMs = 0;
  maxScroll = 0;
}

function onScroll() {
  const h = document.documentElement;
  const max = h.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 100;
  if (pct > maxScroll) maxScroll = Math.min(100, pct);
}

/** Called on every route change (SiteTracker component). */
export function trackPageView(path: string) {
  if (!enabled) return;
  if (path === currentPath) return;
  endEngagement();
  currentPath = path;
  visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
  if (!isTrackablePath(path)) { currentPath = ""; return; }
  push("page_view", path, firstView ? attribution : {});
  firstView = false;
  requestAnimationFrame(onScroll);
}

function onClick(e: MouseEvent) {
  const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a || !currentPath) return;
  const c = classifyLink(a.href, location.origin, a.hasAttribute("download"));
  if (!c) return;
  track(c.event, { href: clip(c.target, 200), text: clip(a.textContent?.trim() ?? "", 80) });
  // Lead actions also go to GA4, as key-event candidates.
  if (["cta_click", "email_click", "linkedin_click", "rates_click"].includes(c.event)) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: c.event, link_url: c.target, page_path: currentPath });
  }
}

function observeVitals() {
  if (typeof PerformanceObserver === "undefined") return;
  const landing = currentPath || location.pathname;
  const vitals: Record<string, number> = {};
  const rate = (name: string, v: number) => {
    const [good, poor] = ({ LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25], FCP: [1800, 3000], TTFB: [800, 1800] } as Record<string, [number, number]>)[name];
    return v <= good ? "good" : v <= poor ? "needs-improvement" : "poor";
  };
  const obs = (type: string, cb: (entries: PerformanceEntry[]) => void) => {
    try { new PerformanceObserver((l) => cb(l.getEntries())).observe({ type, buffered: true } as PerformanceObserverInit); } catch { /* unsupported */ }
  };
  obs("largest-contentful-paint", (es) => { const e = es[es.length - 1]; if (e) vitals.LCP = e.startTime; });
  let cls = 0;
  obs("layout-shift", (es) => { for (const e of es as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) cls += e.value; vitals.CLS = cls; });
  obs("event", (es) => {
    for (const e of es as (PerformanceEntry & { interactionId?: number })[]) if (e.interactionId) vitals.INP = Math.max(vitals.INP ?? 0, e.duration);
  });
  obs("paint", (es) => { for (const e of es) if (e.name === "first-contentful-paint") vitals.FCP = e.startTime; });
  const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav) vitals.TTFB = nav.responseStart;
  let sent = false;
  const report = () => {
    if (sent) return;
    sent = true;
    for (const [name, v] of Object.entries(vitals)) {
      if (!Number.isFinite(v)) continue;
      push("web_vital", landing, { value: Math.round(v * (name === "CLS" ? 1000 : 1)) / (name === "CLS" ? 1000 : 1), props: { name, rating: rate(name, v) } });
    }
    flush(true); // this can run after the tracker's own hidden-flush: send now, the tab may be closing
  };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") report(); });
  addEventListener("pagehide", report);
}

/** Start once, in the browser. Returns false when this visit is not measured. */
export function initSiteTracker(): boolean {
  if (enabled || typeof window === "undefined" || isBot()) return enabled;
  enabled = true;
  visitId = (crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`).replace(/-/g, "").slice(0, 32);
  internal = hasSession();

  const params = new URLSearchParams(location.search);
  let ref: string | null = null;
  try { ref = document.referrer ? new URL(document.referrer).hostname : null; } catch { ref = null; }
  attribution.referrer_host = ref && ref !== location.hostname && ref !== `www.${location.hostname}` ? clip(ref, 120) : null;
  attribution.utm_source = clip(params.get("utm_source"), 100);
  attribution.utm_medium = clip(params.get("utm_medium"), 100);
  attribution.utm_campaign = clip(params.get("utm_campaign"), 100);

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("click", onClick, { capture: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (visibleSince) { visibleMs += Date.now() - visibleSince; visibleSince = 0; }
      // Report engagement so far, keep measuring if the visitor comes back.
      if (currentPath && visibleMs >= 1000) {
        push("engagement", currentPath, { value: Math.round(visibleMs), props: { scroll: Math.round(maxScroll) } });
        visibleMs = 0;
      }
      flush(true);
    } else if (currentPath && !visibleSince) {
      visibleSince = Date.now(); // a repeated "visible" must not restart the clock
    }
  });
  addEventListener("pagehide", () => { endEngagement(); flush(true); });
  addEventListener("error", (e) => {
    if (errors++ >= MAX_ERRORS) return;
    track("js_error", { message: clip(String(e.message || "error"), 200), source: clip(e.filename, 200), line: e.lineno });
  });
  addEventListener("unhandledrejection", (e) => {
    if (errors++ >= MAX_ERRORS) return;
    track("js_error", { message: clip(String((e.reason as Error)?.message ?? e.reason ?? "rejection"), 200) });
  });
  observeVitals();
  return true;
}
