import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The tracker keeps module state (enabled, currentPath, queue) and reads its endpoint at load,
// so every test stubs the env and imports a fresh copy. Copies from earlier tests keep their
// window listeners, so assertions look at the rows that matter (by path, or by the visit id of
// the copy under test), not at the total count.

type Sent = { visit_id: string; event: string; path: string; value?: number | null; props?: Record<string, unknown> | null };

let rows: Sent[] = [];
let visibility: DocumentVisibilityState = "visible";

/** Stands in for the browser's observer: reports one FCP for "paint"; other types via emit(). */
const observers = new Map<string, (l: { getEntries: () => PerformanceEntry[] }) => void>();
class FakePerformanceObserver {
  constructor(private cb: (l: { getEntries: () => PerformanceEntry[] }) => void) {}
  observe({ type }: { type: string }) {
    observers.set(type, this.cb);
    if (type === "paint") this.cb({ getEntries: () => [{ name: "first-contentful-paint", startTime: 900 } as PerformanceEntry] });
  }
}
const emit = (type: string, entries: object[]) => observers.get(type)?.({ getEntries: () => entries as PerformanceEntry[] });

async function load(path: string) {
  window.history.pushState({}, "", path);
  vi.resetModules();
  return import("./siteTracker");
}

const leave = () => window.dispatchEvent(new Event("pagehide"));
const setVisibility = (v: DocumentVisibilityState) => { visibility = v; document.dispatchEvent(new Event("visibilitychange")); };
const setScroll = (y: number) => { Object.defineProperty(window, "scrollY", { configurable: true, value: y }); window.dispatchEvent(new Event("scroll")); };
/** The rows of the copy under test, found through the visit id on its page view of `path`. */
const visitRows = (path: string) => {
  const id = rows.find((r) => r.event === "page_view" && r.path === path)?.visit_id;
  return rows.filter((r) => id && r.visit_id === id);
};

beforeEach(() => {
  rows = [];
  visibility = "visible";
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-key");
  vi.stubGlobal("PerformanceObserver", FakePerformanceObserver);
  vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => {
    rows.push(...(JSON.parse(String(init.body)) as Sent[]));
    return Promise.resolve(new Response(null, { status: 201 }));
  }));
});

afterEach(() => {
  leave(); // flush whatever any copy still holds before the next test's fetch stub
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, "visibilityState");
  Reflect.deleteProperty(window, "scrollY");
  Reflect.deleteProperty(document.documentElement, "scrollHeight");
  window.history.pushState({}, "", "/");
});

describe("siteTracker private routes", () => {
  it("sends nothing at all from a direct visit to a private route: no vitals, errors or events", async () => {
    const t = await load("/login");
    expect(t.initSiteTracker()).toBe(true);
    t.trackPageView("/login");
    t.track("cta_click", { href: "x" });
    window.dispatchEvent(new ErrorEvent("error", { message: "boom" }));
    leave();
    expect(rows.filter((r) => r.path === "/login")).toEqual([]);
  });

  it("treats a differently cased or encoded private route the same", async () => {
    const t = await load("/Samantha");
    t.initSiteTracker();
    t.trackPageView("/Samantha");
    t.trackPageView("/%73amantha");
    leave();
    expect(rows.filter((r) => /amantha/i.test(r.path))).toEqual([]);
  });

  it("drops an error thrown right after navigating to a private route, before the route tracker caught up", async () => {
    const t = await load("/");
    t.initSiteTracker();
    t.trackPageView("/");
    window.history.pushState({}, "", "/samantha"); // currentPath is still "/"
    window.dispatchEvent(new ErrorEvent("error", { message: "private boom" }));
    leave();
    expect(rows.find((r) => r.event === "js_error" && r.props?.message === "private boom")).toBeUndefined();
  });

  it("does measure a public landing page, vitals included", async () => {
    const t = await load("/rates");
    t.initSiteTracker();
    t.trackPageView("/rates");
    window.dispatchEvent(new ErrorEvent("error", { message: "public boom" }));
    leave();
    expect(rows.find((r) => r.event === "page_view" && r.path === "/rates")).toBeDefined();
    expect(rows.find((r) => r.event === "web_vital" && r.path === "/rates" && r.props?.name === "FCP")).toBeDefined();
    expect(rows.find((r) => r.event === "js_error" && r.path === "/rates" && r.props?.message === "public boom")).toBeDefined();
  });
});

describe("siteTracker engagement and vitals around a private route", () => {
  it("does not carry time spent on a private route into the next public page", async () => {
    let now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const t = await load("/samantha");
    t.initSiteTracker();
    t.trackPageView("/samantha");
    now += 600_000; // ten minutes on the private page, with a hide and show in between
    setVisibility("hidden");
    setVisibility("visible");
    window.history.pushState({}, "", "/");
    t.trackPageView("/");
    now += 2_000;
    leave();
    expect(visitRows("/").filter((r) => r.event === "engagement")).toEqual([expect.objectContaining({ path: "/", value: 2000 })]);
  });

  it("does not carry scroll depth reached on a private route into the next public page", async () => {
    let now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: window.innerHeight + 1000 });
    const t = await load("/samantha");
    t.initSiteTracker();
    t.trackPageView("/samantha");
    setScroll(1000); // the bottom of the private page
    window.history.pushState({}, "", "/");
    setScroll(0);
    t.trackPageView("/");
    now += 5_000;
    leave();
    expect(visitRows("/").filter((r) => r.event === "engagement")).toEqual([expect.objectContaining({ path: "/", props: { scroll: 0 } })]);
  });

  it("still measures scroll depth on a public page", async () => {
    let now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: window.innerHeight + 1000 });
    const t = await load("/");
    t.initSiteTracker();
    setScroll(0);
    t.trackPageView("/");
    setScroll(500);
    now += 5_000;
    leave();
    expect(visitRows("/").filter((r) => r.event === "engagement")).toEqual([expect.objectContaining({ path: "/", props: { scroll: 50 } })]);
  });

  it("ends the landing page's vitals at the first private route: later shifts and input are not its own", async () => {
    const t = await load("/");
    t.initSiteTracker();
    t.trackPageView("/");
    const before = performance.now() - 1;
    emit("layout-shift", [{ startTime: before, value: 0.05, hadRecentInput: false }]);
    emit("event", [{ startTime: before, duration: 120, interactionId: 1 }]);
    window.history.pushState({}, "", "/samantha");
    t.trackPageView("/samantha");
    const after = performance.now() + 1;
    emit("layout-shift", [{ startTime: after, value: 0.5, hadRecentInput: false }]);
    emit("event", [{ startTime: after, duration: 900, interactionId: 2 }]);
    leave();
    const vital = (name: string) => visitRows("/").find((r) => r.event === "web_vital" && r.props?.name === name);
    expect(vital("CLS")).toEqual(expect.objectContaining({ path: "/", value: 0.05 }));
    expect(vital("INP")).toEqual(expect.objectContaining({ path: "/", value: 120 }));
    expect(rows.filter((r) => r.path === "/samantha")).toEqual([]);
  });
});

describe("track with an explicit path", () => {
  it("starts the tracker itself, so a 404 on first load is not lost", async () => {
    const t = await load("/does-not-exist");
    t.track("not_found", { referrer: null }, undefined, "/does-not-exist"); // before SiteTracker's effect
    leave();
    expect(rows.filter((r) => r.event === "not_found")).toEqual([expect.objectContaining({ path: "/does-not-exist" })]);
  });

  it("attributes a 404 on an SPA transition to the new route, not the previous page", async () => {
    const t = await load("/");
    t.initSiteTracker();
    t.trackPageView("/");
    window.history.pushState({}, "", "/old-link");
    t.track("not_found", { referrer: null }, undefined, "/old-link"); // currentPath is still "/"
    leave();
    expect(rows.filter((r) => r.event === "not_found")).toEqual([expect.objectContaining({ path: "/old-link" })]);
  });

  it("still drops an explicit private path", async () => {
    const t = await load("/");
    t.track("not_found", undefined, undefined, "/dashboards/nope");
    leave();
    expect(rows.filter((r) => r.event === "not_found")).toEqual([]);
  });
});
