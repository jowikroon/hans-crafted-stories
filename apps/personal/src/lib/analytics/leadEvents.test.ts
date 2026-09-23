import { beforeEach, describe, expect, it } from "vitest";
import { installContactCtaTracking, pushLeadEvent } from "./leadEvents";

describe("lead events", () => {
  beforeEach(() => {
    window.dataLayer = [];
    document.body.innerHTML = "";
  });

  it("drops any non-whitelisted (personal) parameter", () => {
    const p = pushLeadEvent("contact_form_submit", {
      result: "sent",
      reason_category: "freelance",
      email: "someone@example.com",
      name: "Someone",
      message: "free text",
    });
    expect(p).toEqual({ event: "contact_form_submit", result: "sent", reason_category: "freelance" });
    expect(JSON.stringify(window.dataLayer)).not.toMatch(/example\.com|Someone|free text/);
  });

  it("tracks clicks on #contact and mailto links, ignores other links", () => {
    const off = installContactCtaTracking(document);
    document.body.innerHTML = `
      <a id="a" href="/nl/about#contact" data-cta="hero">x</a>
      <a id="b" href="mailto:">y</a>
      <a id="c" href="/work">z</a>`;
    for (const id of ["a", "b", "c"]) document.getElementById(id)!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    off();
    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer[0]).toMatchObject({ event: "contact_cta_click", cta_id: "hero", cta_target: "contact_form" });
    expect(window.dataLayer[1]).toMatchObject({ event: "contact_cta_click", cta_id: "unlabeled", cta_target: "email" });
  });
});
