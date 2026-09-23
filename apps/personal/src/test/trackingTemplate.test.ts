import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Review R3: zonder JavaScript mag de HTML geen tracking laden (geen host-check, geen consent mogelijk).
const html = fs.readFileSync(path.resolve(__dirname, "../../index.html"), "utf8");
const noscriptBlocks = [...html.matchAll(/<noscript>([\s\S]*?)<\/noscript>/gi)].map((m) => m[1]);

describe("index.html tracking template", () => {
  it("has no GTM/analytics request inside <noscript>", () => {
    for (const block of noscriptBlocks) {
      expect(block).not.toMatch(/googletagmanager\.com|google-analytics\.com|hotjar|<iframe/i);
    }
  });

  it("only loads GTM behind the production-host check", () => {
    const gtmScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter((s) => s.includes("gtm.js"));
    expect(gtmScripts).toHaveLength(1);
    expect(gtmScripts[0]).toMatch(/if \(location\.hostname === 'hansvanleeuwen\.com'\)/);
  });
});
