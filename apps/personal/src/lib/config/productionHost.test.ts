import { describe, expect, it } from "vitest";
import { isProductionHost } from "./productionHost";

describe("isProductionHost", () => {
  it("accepts only the apex production domain", () => {
    expect(isProductionHost("hansvanleeuwen.com")).toBe(true);
    expect(isProductionHost("HansVanLeeuwen.com")).toBe(true);
  });

  it("rejects previews, localhost and look-alikes", () => {
    for (const host of [
      "localhost",
      "127.0.0.1",
      "hans-crafted-stories-git-growth-b1.vercel.app",
      "www.hansvanleeuwen.com",
      "hansvanleeuwen.com.evil.test",
      "",
    ]) {
      expect(isProductionHost(host)).toBe(false);
    }
  });

  it("defaults to window.location (jsdom = localhost → not production)", () => {
    expect(isProductionHost()).toBe(false);
  });
});
