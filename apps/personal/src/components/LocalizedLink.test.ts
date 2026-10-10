import { describe, expect, it } from "vitest";
import { localizeHref } from "@/lib/i18n/routes";

// Sinds #396: NL op het kale pad, EN onder /en.
describe("localizeHref", () => {
  it("keeps the #contact anchor (regression: CTA's landed at the top of About)", () => {
    expect(localizeHref("/about#contact", "nl")).toBe("/about#contact");
    expect(localizeHref("/about#contact", "en")).toBe("/en/about#contact");
  });

  it("keeps query strings and still localizes the path", () => {
    expect(localizeHref("/work?filter=ux", "en")).toBe("/en/work?filter=ux");
    expect(localizeHref("/writing/some-post?lang=en", "nl")).toBe("/writing/some-post?lang=en");
  });

  it("leaves plain paths unchanged in behaviour", () => {
    expect(localizeHref("/", "en")).toBe("/en");
    expect(localizeHref("/about", "nl")).toBe("/about");
  });
});
