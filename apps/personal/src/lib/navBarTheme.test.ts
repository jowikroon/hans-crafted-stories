import { describe, expect, it } from "vitest";
import { isMusicVisualRoute, shouldUseDarkNav } from "./navBarTheme";

describe("music route-aware navbar contrast", () => {
  it.each([
    "/music",
    "/music/albums/neon-the-signal-between",
    "/music/albums/iets-moois",
    "/music/albums/iets-moois/brand",
  ])("uses the dark navigation on %s even when the visitor prefers light", (path) => {
    expect(isMusicVisualRoute(path)).toBe(true);
    expect(shouldUseDarkNav(path, "light", false)).toBe(true);
  });

  it.each(["/", "/en", "/writing", "/music-cms", "/music/beat-drop"])(
    "keeps the global light navigation on unrelated route %s",
    (path) => {
      expect(isMusicVisualRoute(path)).toBe(false);
      expect(shouldUseDarkNav(path, "light", false)).toBe(false);
    },
  );

  it("preserves the global dark preference on ordinary pages", () => {
    expect(shouldUseDarkNav("/en", "dark", false)).toBe(true);
  });

  it("never darkens explicit light backend surfaces", () => {
    expect(shouldUseDarkNav("/music-cms", "dark", true)).toBe(false);
    expect(shouldUseDarkNav("/music/albums/iets-moois", "light", true)).toBe(false);
  });
});
