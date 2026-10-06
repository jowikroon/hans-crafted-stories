import { describe, expect, it } from "vitest";
import { classifyLink, deviceClass, isTrackablePath } from "./siteTrackerCore";

const O = "https://hansvanleeuwen.com";

describe("classifyLink", () => {
  it("classifies lead actions", () => {
    expect(classifyLink("mailto:hans@example.com", O)?.event).toBe("email_click");
    expect(classifyLink("https://calendly.com/hansvl3/30min", O)?.event).toBe("book_call");
    expect(classifyLink("https://www.linkedin.com/in/hans", O)?.event).toBe("linkedin_click");
    expect(classifyLink("/about#contact", O)).toEqual({ event: "cta_click", target: "/about#contact" });
    expect(classifyLink("/nl/rates", O)?.event).toBe("rates_click");
  });

  it("separates downloads and outbound links from internal navigation", () => {
    expect(classifyLink("/Cv_HvL_-_Ecommerce.pdf", O)?.event).toBe("download");
    expect(classifyLink("/x", O, true)?.event).toBe("download");
    expect(classifyLink("https://github.com/jowikroon", O)?.event).toBe("outbound_click");
    expect(classifyLink("/writing/some-post", O)).toBeNull();
    expect(classifyLink("https://www.hansvanleeuwen.com/work", O)).toBeNull();
  });

  it("does not treat a lookalike host as a lead", () => {
    expect(classifyLink("https://calendly.com.evil.example/x", O)?.event).toBe("outbound_click");
    expect(classifyLink("javascript:void(0)", O)).toBeNull();
  });
});

describe("isTrackablePath", () => {
  it("skips admin and tool routes", () => {
    for (const p of ["/write", "/dashboards/hvl", "/portal", "/samantha", "/__e2e-test__", "/ccp-dashboard.html"]) {
      expect(isTrackablePath(p)).toBe(false);
    }
    for (const p of ["/", "/nl", "/writing/x", "/nl/interim-ecommerce-manager", "/writer"]) expect(isTrackablePath(p)).toBe(true);
  });
});

describe("deviceClass", () => {
  it("buckets by viewport width", () => {
    expect([deviceClass(390), deviceClass(900), deviceClass(1440)]).toEqual(["mobile", "tablet", "desktop"]);
  });
});
