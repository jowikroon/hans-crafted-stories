import { describe, expect, it } from "vitest";
import { localizeHref } from "./LocalizedLink";

describe("localizeHref", () => {
  it("keeps the #contact anchor (regression: CTA's landed at the top of About)", () => {
    expect(localizeHref("/about#contact", "en")).toBe("/about#contact");
    expect(localizeHref("/about#contact", "nl")).toBe("/nl/about#contact");
  });

  it("keeps query strings and still localizes the path", () => {
    expect(localizeHref("/work?filter=ux", "nl")).toBe("/nl/work?filter=ux");
    expect(localizeHref("/writing/some-post?lang=en", "nl")).toBe("/writing/some-post?lang=en");
  });

  it("leaves plain paths unchanged in behaviour", () => {
    expect(localizeHref("/", "nl")).toBe("/nl");
    expect(localizeHref("/about", "en")).toBe("/about");
  });
});
