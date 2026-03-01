import { describe, it, expect } from "vitest";
import {
  HIERARCHY_MAP,
  ALL_TABS,
  getDefaultHierarchyContext,
  parseHierarchyFromStorage,
  DEFAULT_PRIMARY_GOAL,
} from "./types";

describe("hierarchy types", () => {
  it("DEFAULT_PRIMARY_GOAL is general", () => {
    expect(DEFAULT_PRIMARY_GOAL).toBe("general");
  });

  it("getDefaultHierarchyContext returns general with All tab and Alle resources", () => {
    const ctx = getDefaultHierarchyContext();
    expect(ctx.primaryGoal).toBe("general");
    expect(ctx.activeTabs).toContain("All");
    expect(ctx.subTools).toContain("Alle resources");
    expect(Array.isArray(ctx.scope)).toBe(true);
  });

  it("HIERARCHY_MAP has all 7 primary goals with tabs and subTools", () => {
    const goals = [
      "seo_content",
      "n8n_workflows",
      "data_feeds",
      "campaigns",
      "web_scraping",
      "system_health",
      "general",
    ];
    for (const goal of goals) {
      expect(HIERARCHY_MAP[goal as keyof typeof HIERARCHY_MAP]).toBeDefined();
      expect(Array.isArray(HIERARCHY_MAP[goal as keyof typeof HIERARCHY_MAP].tabs)).toBe(true);
      expect(Array.isArray(HIERARCHY_MAP[goal as keyof typeof HIERARCHY_MAP].subTools)).toBe(true);
    }
  });

  it("ALL_TABS includes All, SEO, Infrastructure", () => {
    expect(ALL_TABS).toContain("All");
    expect(ALL_TABS).toContain("SEO");
    expect(ALL_TABS).toContain("Infrastructure");
  });

  it("parseHierarchyFromStorage returns null for null or empty", () => {
    expect(parseHierarchyFromStorage(null)).toBeNull();
    expect(parseHierarchyFromStorage("")).toBeNull();
  });

  it("parseHierarchyFromStorage returns null for invalid JSON", () => {
    expect(parseHierarchyFromStorage("not json")).toBeNull();
    expect(parseHierarchyFromStorage("{}")).toBeNull();
  });

  it("parseHierarchyFromStorage returns null for invalid primaryGoal", () => {
    expect(parseHierarchyFromStorage(JSON.stringify({ primaryGoal: "invalid" }))).toBeNull();
  });

  it("parseHierarchyFromStorage returns valid context for valid stored payload", () => {
    const stored = JSON.stringify({
      primaryGoal: "seo_content",
      activeTabs: ["SEO", "Content"],
      subTools: ["AutoSEO Brain"],
      scope: [],
    });
    const parsed = parseHierarchyFromStorage(stored);
    expect(parsed).not.toBeNull();
    expect(parsed!.primaryGoal).toBe("seo_content");
    expect(parsed!.activeTabs).toEqual(["SEO", "Content"]);
    expect(parsed!.subTools).toEqual(["AutoSEO Brain"]);
    expect(parsed!.scope).toEqual([]);
  });
});
