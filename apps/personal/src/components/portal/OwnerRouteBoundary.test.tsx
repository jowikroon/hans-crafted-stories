import { describe, expect, it } from "vitest";
import { isOwnerRoute } from "./OwnerRouteBoundary";

describe("public Artist Radar route", () => {
  it("allows visitors to open the signup page without the owner portal", () => {
    expect(isOwnerRoute("/muziek/artist-radar")).toBe(false);
    expect(isOwnerRoute("/muziek/artist-radar/")).toBe(false);
    expect(isOwnerRoute("/music")).toBe(false);
  });

  it("keeps the actual owner tools behind the portal", () => {
    expect(isOwnerRoute("/music-cms")).toBe(true);
    expect(isOwnerRoute("/dashboards")).toBe(true);
    expect(isOwnerRoute("/music-cms/library")).toBe(true);
    expect(isOwnerRoute("/dashboards/private")).toBe(true);
  });
});
