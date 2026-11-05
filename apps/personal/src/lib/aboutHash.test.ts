import { describe, expect, it } from "vitest";
import { getAboutSectionFromHash } from "./aboutHash";

describe("About cross-page anchor navigation", () => {
  it("resolves the contact section linked by blog CTAs", () => {
    expect(getAboutSectionFromHash("#contact")).toBe("contact");
  });

  it("keeps valid in-page chapter anchors", () => {
    expect(getAboutSectionFromHash("#verhaal")).toBe("verhaal");
    expect(getAboutSectionFromHash("#loopbaan")).toBe("loopbaan");
    expect(getAboutSectionFromHash("#diensten")).toBe("diensten");
  });

  it("ignores invalid or malformed hashes", () => {
    expect(getAboutSectionFromHash("#unknown")).toBeNull();
    expect(getAboutSectionFromHash("#%zz")).toBeNull();
    expect(getAboutSectionFromHash("")).toBeNull();
  });
});
