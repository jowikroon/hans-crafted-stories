/**
 * Header-logo regression guard.
 *
 * The on-page editor (edit-overlay) lets an admin pick a header logo, which is
 * persisted site-wide. For that to actually do anything, the Navbar MUST render
 * the active logo image — earlier it hardcoded a static "h" letter, so changing
 * the logo silently did nothing. These tests fail the build if that regresses.
 */
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LangProvider } from "@/hooks/useLang";
import { LogoProvider } from "@/contexts/LogoContext";
import { LOGOS, DEFAULT_LOGO_ID, logoById } from "@/lib/logos";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, signOut: vi.fn() }) }));
vi.mock("@/hooks/useAdmin", () => ({ useAdmin: () => ({ isAdmin: false, loading: false }) }));

import Navbar from "./Navbar";

const renderWithLogo = (activeLogoId: string) =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <LangProvider initialLang="nl">
        <LogoProvider value={{ activeLogoId, setActiveLogo: vi.fn() }}>
          <Navbar />
        </LogoProvider>
      </LangProvider>
    </MemoryRouter>,
  );

afterEach(cleanup);

describe("header renders the active logo (editor logo switch must work)", () => {
  it("renders an <img> for every logo in the registry", () => {
    expect(LOGOS.length).toBeGreaterThan(0);
    for (const l of LOGOS) {
      const { unmount } = renderWithLogo(l.id);
      const imgs = screen.getAllByRole("img");
      const match = imgs.find((i) => i.getAttribute("src") === l.src);
      expect(match, `Navbar must render an <img> with src for logo "${l.id}"`).toBeTruthy();
      unmount();
    }
  });

  it("switching the active logo changes the rendered image src", () => {
    const [a, b] = [LOGOS[0], LOGOS[LOGOS.length - 1]];
    if (a.id === b.id) return; // only one logo registered — nothing to compare

    const first = renderWithLogo(a.id);
    const srcA = screen.getAllByRole("img").map((i) => i.getAttribute("src"));
    expect(srcA).toContain(a.src);
    first.unmount();

    renderWithLogo(b.id);
    const srcB = screen.getAllByRole("img").map((i) => i.getAttribute("src"));
    expect(srcB).toContain(b.src);
    expect(srcB).not.toContain(a.src);
  });

  it("falls back to the default logo for an unknown id (never blank)", () => {
    renderWithLogo("does-not-exist");
    const fallback = logoById("does-not-exist");
    expect(fallback.id).toBe(DEFAULT_LOGO_ID);
    const srcs = screen.getAllByRole("img").map((i) => i.getAttribute("src"));
    expect(srcs).toContain(fallback.src);
  });
});
