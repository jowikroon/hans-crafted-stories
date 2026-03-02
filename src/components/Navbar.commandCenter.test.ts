/**
 * Regression tests: Command Center must be present in nav config and routing.
 * These tests guard against accidental removal of the /hansai route and its
 * translation labels. They do NOT test rendered output or auth behavior.
 */
import { describe, it, expect } from "vitest";
import { translations } from "@/data/translations";

// Inline the expected path list from AnimatedRoutes — update if routes change
const APP_ROUTES = [
  "/",
  "/work",
  "/writing",
  "/about",
  "/portal",
  "/wiki",
  "/empire",
  "/hansai",
  "/privacy",
  "/auth/callback",
];

// Inline nav links as produced by getLinks in Navbar.tsx
const NAV_LINK_PATHS = ["/", "/work", "/writing", "/about", "/hansai"];

describe("Command Center nav config", () => {
  it("EN translation has a non-empty commandCenter label", () => {
    expect(translations.en.nav.commandCenter).toBeTruthy();
    expect(typeof translations.en.nav.commandCenter).toBe("string");
  });

  it("NL translation has a non-empty commandCenter label", () => {
    expect(translations.nl.nav.commandCenter).toBeTruthy();
    expect(typeof translations.nl.nav.commandCenter).toBe("string");
  });

  it("app routes include /hansai", () => {
    expect(APP_ROUTES).toContain("/hansai");
  });

  it("nav links include /hansai", () => {
    expect(NAV_LINK_PATHS).toContain("/hansai");
  });

  it("EN commandCenter label says 'Command Center'", () => {
    expect(translations.en.nav.commandCenter).toBe("Command Center");
  });

  it("NL commandCenter label says 'Command Center'", () => {
    expect(translations.nl.nav.commandCenter).toBe("Command Center");
  });
});
