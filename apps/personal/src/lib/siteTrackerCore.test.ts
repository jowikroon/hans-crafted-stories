import { describe, expect, it } from "vitest";
import { classifyLink, deviceClass, isTrackablePath, referrerPage } from "./siteTrackerCore";

const O = "https://hansvanleeuwen.com";

describe("classifyLink", () => {
  it("classifies lead actions", () => {
    expect(classifyLink("mailto:hans@example.com", O)?.event).toBe("email_click");
    expect(classifyLink("https://calendly.com/hansvl3/30min", O)?.event).toBe("book_call");
    expect(classifyLink("https://www.linkedin.com/in/hans", O)?.event).toBe("linkedin_click");
    expect(classifyLink("/about#contact", O)).toEqual({ event: "cta_click", target: "/about#contact" });
    for (const p of ["/rates", "/en/rates", "/nl/rates", "/nl/tarieven"]) expect(classifyLink(p, O)?.event).toBe("rates_click");
  });

  it("separates downloads and outbound links from internal navigation", () => {
    expect(classifyLink("/Cv_HvL_-_Ecommerce.pdf", O)?.event).toBe("download");
    expect(classifyLink("/x", O, true)?.event).toBe("download");
    expect(classifyLink("https://github.com/jowikroon", O)?.event).toBe("outbound_click");
    expect(classifyLink("/writing/some-post", O)).toBeNull();
    expect(classifyLink("https://www.hansvanleeuwen.com/work", O)).toBeNull();
  });

  it("keeps only host and path of the link, as the privacy policy says", () => {
    expect(classifyLink("https://github.com/jowikroon?ref=a%40b.nl#x", O)).toEqual({ event: "outbound_click", target: "github.com/jowikroon" });
    expect(classifyLink("/files/cv.pdf?token=abc", O)).toEqual({ event: "download", target: "hansvanleeuwen.com/files/cv.pdf" });
    expect(classifyLink("mailto:someone@example.com?subject=hi", O)).toEqual({ event: "email_click", target: "mailto" });
  });

  it("does not treat a lookalike host as a lead", () => {
    expect(classifyLink("https://calendly.com.evil.example/x", O)?.event).toBe("outbound_click");
    expect(classifyLink("javascript:void(0)", O)).toBeNull();
  });
});

describe("isTrackablePath", () => {
  it("skips admin and tool routes", () => {
    for (const p of [
      "/write", "/dashboards/hvl", "/portal", "/samantha", "/login", "/auth/callback", "/admin", "/__e2e-test__", "/ccp-dashboard.html",
      "/music-cms", "/music-cms/42", "/release-set", "/blog-cms/voice/7", "/wiki", "/god-structure", "/empire", "/hans-ai", "/command",
    ]) {
      expect(isTrackablePath(p)).toBe(false);
    }
    for (const p of ["/", "/nl", "/writing/x", "/nl/interim-ecommerce-manager", "/writer", "/music", "/music/some-song", "/muziek/artist-radar"]) {
      expect(isTrackablePath(p)).toBe(true);
    }
  });

  it("skips them the way the router matches them: any case, percent-encoded", () => {
    for (const p of ["/Samantha", "/DASHBOARDS/hvl", "/Write/abc", "/%73amantha", "/dash%62oards"]) expect(isTrackablePath(p)).toBe(false);
    expect(isTrackablePath("/writing/%E2%82%AC-pricing")).toBe(true);
    expect(isTrackablePath("/writing/100%")).toBe(true); // malformed escape: no throw
  });
});

describe("referrerPage", () => {
  it("keeps origin and path, never the query string or fragment", () => {
    expect(referrerPage("https://hansvanleeuwen.com/writing/x?email=a%40b.nl&token=abc#top")).toBe("https://hansvanleeuwen.com/writing/x");
    expect(referrerPage("https://www.google.com/")).toBe("https://www.google.com/");
  });

  it("returns null for no referrer, a malformed one or a non-web scheme, and clips to 200", () => {
    expect([referrerPage(""), referrerPage(null), referrerPage("not a url"), referrerPage("android-app://com.x/")]).toEqual([null, null, null, null]);
    expect(referrerPage(`https://example.com/${"a".repeat(300)}`)).toHaveLength(200);
  });
});

describe("deviceClass", () => {
  it("buckets by viewport width", () => {
    expect([deviceClass(390), deviceClass(900), deviceClass(1440)]).toEqual(["mobile", "tablet", "desktop"]);
  });
});
