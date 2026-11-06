import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(join(process.cwd(), "src/styles/music-album-world.css"), "utf8");

describe("album manifesto color treatment", () => {
  it("keeps the shared manifesto dark and gives IETS MOOIS its own forest-green surface", () => {
    const shared = styles.match(/\.ma-manifesto\s*\{([^}]+)\}/)?.[1];
    const warm = styles.match(/\.ma-page--editorial\.ma-theme--warm \.ma-manifesto\s*\{([^}]+)\}/)?.[1];

    expect(shared).toContain("linear-gradient");
    expect(warm).toContain("linear-gradient");
    expect(shared).not.toMatch(/background:\s*#(?:fff(?:fff)?|eeeee6|eaeade)\b/i);
    expect(warm).toContain("#14271e");
  });

  it("keeps labels, the second title line and links legible against the new dark surfaces", () => {
    for (const obsoleteInk of ["#162c23", "#46574e", "#59685e", "#162c2340"]) {
      expect(styles).not.toContain(obsoleteInk);
    }
    expect(styles).toMatch(/\.ma-page--editorial\.ma-theme--warm \.ma-manifesto \.ma-eyebrow/);
    expect(styles).toMatch(/\.ma-page--editorial\.ma-theme--warm \.ma-manifesto h2>span:last-child/);
    expect(styles).toMatch(/\.ma-page--editorial\.ma-theme--warm \.ma-manifesto \.ma-text-link/);
  });
});
