import { act, render } from "@testing-library/react";
import { MemoryRouter, useNavigate, type NavigateFunction } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import vercelConfig from "../../vercel.json";

/* Ahrefs Web Analytics: alleen productiedomein + toestemming, nooit private routes. */

const env = vi.hoisted(() => ({ hostname: "hansvanleeuwen.com" }));
vi.mock("@/lib/ahrefsAnalytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ahrefsAnalytics")>();
  // jsdom draait op localhost; de hostnaam komt hier uit de test.
  return { ...actual, shouldLoadAhrefs: (o: Parameters<typeof actual.shouldLoadAhrefs>[0]) => actual.shouldLoadAhrefs({ ...o, hostname: env.hostname }) };
});

import AhrefsAnalytics from "./AhrefsAnalytics";
import { AHREFS_KEY, AHREFS_SRC, CONSENT_EVENT, CONSENT_KEY, isPrivatePath, pageNavigator } from "@/lib/ahrefsAnalytics";

const nav: { go?: NavigateFunction } = {};
const Nav = () => {
  nav.go = useNavigate();
  return null;
};
const mount = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AhrefsAnalytics />
      <Nav />
    </MemoryRouter>
  );
const script = () => document.head.querySelector<HTMLScriptElement>(`script[src="${AHREFS_SRC}"]`);
const announce = (choice: "accepted" | "declined") => act(() => void window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice })));

beforeEach(() => {
  env.hostname = "hansvanleeuwen.com";
  localStorage.clear();
  document.head.innerHTML = "";
});
afterEach(() => vi.restoreAllMocks());

describe("AhrefsAnalytics", () => {
  it("loads nothing without a consent choice", () => {
    mount("/");
    expect(script()).toBeNull();
  });

  it("loads nothing after a refusal", () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    mount("/");
    expect(script()).toBeNull();
  });

  it("with consent on the production domain: one async script with the data-key", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    mount("/");
    const s = script();
    expect(s).not.toBeNull();
    expect(s!.async).toBe(true);
    expect(s!.getAttribute("data-key")).toBe(AHREFS_KEY);
    mount("/about");
    expect(document.head.querySelectorAll(`script[src="${AHREFS_SRC}"]`)).toHaveLength(1);
  });

  it("loads nothing on previews or localhost, even with consent", () => {
    env.hostname = "hans-crafted-stories-git-x.vercel.app";
    localStorage.setItem(CONSENT_KEY, "accepted");
    mount("/");
    expect(script()).toBeNull();
  });

  it("loads nothing on a private route, even with consent", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    mount("/dashboards/hvl");
    expect(script()).toBeNull();
  });

  it("loads as soon as the visitor accepts in the banner (no reload needed)", () => {
    mount("/");
    expect(script()).toBeNull();
    localStorage.setItem(CONSENT_KEY, "accepted");
    announce("accepted");
    expect(script()).not.toBeNull();
  });

  it("withdrawing consent after loading reloads the page so the script stops", () => {
    const reload = vi.spyOn(pageNavigator, "reload").mockImplementation(() => undefined);
    localStorage.setItem(CONSENT_KEY, "accepted");
    mount("/");
    localStorage.setItem(CONSENT_KEY, "declined");
    announce("declined");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("in-app navigation to a private route after loading does a full page load", () => {
    const assign = vi.spyOn(pageNavigator, "assign").mockImplementation(() => undefined);
    localStorage.setItem(CONSENT_KEY, "accepted");
    mount("/");
    expect(script()).not.toBeNull();
    act(() => void nav.go!("/portal"));
    expect(assign).toHaveBeenCalledTimes(1);
  });
});

describe("ahrefs rules", () => {
  it("requires production host, accepted consent and a public route", async () => {
    // De echte implementatie (de module-mock hierboven zet de hostnaam vast).
    const { shouldLoadAhrefs } = await vi.importActual<typeof import("@/lib/ahrefsAnalytics")>("@/lib/ahrefsAnalytics");
    expect(shouldLoadAhrefs({ hostname: "hansvanleeuwen.com", pathname: "/", consent: "accepted" })).toBe(true);
    expect(shouldLoadAhrefs({ hostname: "hansvanleeuwen.com", pathname: "/nl/writing", consent: "accepted" })).toBe(true);
    expect(shouldLoadAhrefs({ hostname: "hansvanleeuwen.com", pathname: "/", consent: null })).toBe(false);
    expect(shouldLoadAhrefs({ hostname: "hansvanleeuwen.com", pathname: "/", consent: "declined" })).toBe(false);
    expect(shouldLoadAhrefs({ hostname: "localhost", pathname: "/", consent: "accepted" })).toBe(false);
    expect(shouldLoadAhrefs({ hostname: "hansvanleeuwen.com", pathname: "/write/abc", consent: "accepted" })).toBe(false);
  });

  it("covers every workspace route that vercel.json rewrites (private shell or SPA fallback)", () => {
    // Publieke catch-alls (muziek, artikelen) uitgezonderd; de rest zijn werkruimtes.
    const sources = (vercelConfig.rewrites as { source: string; destination: string }[])
      .filter((r) => !/^\/(muziek|music|writing|en\/writing)(\/|$)/.test(r.source))
      .map((r) => r.source);
    expect(sources.length).toBeGreaterThan(0);
    for (const src of sources) {
      // "/(a|b|c)" en "/(a|b)/:id" -> elk alternatief als voorbeeldpad
      const m = /^\/\(([^)]+)\)(.*)$/.exec(src);
      const paths = m ? m[1].split("|").map((seg) => `/${seg}${m[2].replace(/:[a-z*]+/g, "x")}`) : [src.replace(/:[a-z]+\*?/g, "x")];
      for (const p of paths) expect(isPrivatePath(p), p).toBe(true);
    }
  });
});
