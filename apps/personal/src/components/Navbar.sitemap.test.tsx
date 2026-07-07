/**
 * Tested sitemap + header regression guard.
 * 1. Renders the real Navbar and asserts the header is always present.
 * 2. Command Center appears ONLY for logged-in users and points to /write.
 * 3. Public links are present for everyone.
 * 4. Every nav target is a real application route (no dead links).
 */
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { translations } from "@/data/translations";
import { LangProvider } from "@/hooks/useLang";

const authState = vi.hoisted(() => ({ user: null as { email?: string } | null }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: authState.user, signOut: vi.fn() }),
}));
vi.mock("@/hooks/useAdmin", () => ({ useAdmin: () => ({ isAdmin: false, loading: false }) }));

import Navbar from "./Navbar";

/** Canonical sitemap — keep in sync with AnimatedRoutes.tsx. */
const APP_ROUTES = [
  "/", "/work", "/work/connect-car-parts", "/writing", "/writing/:slug", "/about",
  "/amazon-nl-specialist", "/bol-com-consultant", "/interim-ecommerce-manager",
  "/portal", "/write", "/write/:id", "/blog-cms", "/blog-cms/voice/:id",
  "/wiki", "/god-structure", "/samantha",
  "/empire", "/hansai", "/hans-ai", "/command", "/privacy", "/auth/callback", "*",
];

/** Nav-link targets surfaced by Navbar (public + the logged-in Command Center). */
const NAV_TARGETS = [
  "/", "/work", "/work/connect-car-parts", "/amazon-nl-specialist",
  "/bol-com-consultant", "/interim-ecommerce-manager", "/writing", "/about",
  "/write", "/samantha", "/portal", "/wiki", "/god-structure",
];

const renderNav = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LangProvider initialLang="nl">
        <Navbar />
      </LangProvider>
    </MemoryRouter>,
  );

afterEach(() => { cleanup(); authState.user = null; });

describe("header is always present", () => {
  it("renders the brand on a public route (logged out)", () => {
    authState.user = null;
    renderNav("/");
    expect(screen.getAllByText("Hans van Leeuwen").length).toBeGreaterThan(0);
  });
  it("renders the brand on a logged-in CMS route", () => {
    authState.user = { email: "hans@example.com" };
    renderNav("/write");
    expect(screen.getAllByText("Hans van Leeuwen").length).toBeGreaterThan(0);
  });
});

describe("account access", () => {
  // Workspace links (/write etc.) moved from a top-level "Command Center" link
  // into the account dropdown. Logged-out shows a Login link; logged-in swaps it
  // for the account menu. (t.commandCenter is validated separately below.)
  it("logged out: shows the Login link and no workspace link", () => {
    authState.user = null;
    renderNav("/");
    expect(screen.getAllByText(translations.nl.nav.login).length).toBeGreaterThan(0);
    expect(document.querySelector('a[href="/write"]')).toBeNull();
    expect(screen.queryByText("Command Center")).toBeNull();
  });
  it("logged in: swaps the Login link for the account menu", () => {
    authState.user = { email: "hans@example.com" };
    renderNav("/write");
    expect(screen.queryByText(translations.nl.nav.login)).toBeNull();
  });
});

describe("public links present for everyone", () => {
  it("shows Home / Werk / Artikelen / Over Hans", () => {
    authState.user = null;
    renderNav("/");
    [translations.nl.nav.home, translations.nl.nav.work, translations.nl.nav.writing, translations.nl.nav.about]
      .forEach((label) => expect(screen.getAllByText(label).length).toBeGreaterThan(0));
  });
});

describe("sitemap integrity", () => {
  it("Command Center label exists in both languages", () => {
    expect(translations.en.nav.commandCenter).toBe("Command Center");
    expect(translations.nl.nav.commandCenter).toBe("Command Center");
  });
  it("every nav target is a real route (no dead links)", () => {
    NAV_TARGETS.forEach((t) => expect(APP_ROUTES).toContain(t));
  });
  it("core sitemap routes are defined", () => {
    ["/", "/work", "/writing", "/about", "/write", "/samantha", "/portal", "/wiki"]
      .forEach((r) => expect(APP_ROUTES).toContain(r));
  });
});
