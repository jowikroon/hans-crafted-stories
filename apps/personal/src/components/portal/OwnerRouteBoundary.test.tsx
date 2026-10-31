import { describe, expect, it } from "vitest";
import { isOwnerRoute } from "./ownerRoutes";

describe("owner route classification (no authentication client required)", () => {
  it.each([
    "/muziek/artist-radar",
    "/muziek/artist-radar/",
    "/music",
    "/music/some-song",
    "/",
    "/portal",
  ])("keeps public route %s accessible", (path) => {
    expect(isOwnerRoute(path)).toBe(false);
  });

  it.each([
    "/write",
    "/write/story",
    "/blog-cms",
    "/music-cms",
    "/music-cms/library",
    "/release-set",
    "/god-structure",
    "/dashboards",
    "/dashboards/private",
    "/bijlagen",
    "/samantha",
  ])("protects owner route %s", (path) => {
    expect(isOwnerRoute(path)).toBe(true);
  });

  it.each(["/music-cms-public", "/dashboards-public", "/writer", "/samantha-public"])(
    "does not protect unrelated route %s sharing a prefix",
    (path) => {
      expect(isOwnerRoute(path)).toBe(false);
    },
  );
});
