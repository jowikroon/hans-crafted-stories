import { describe, expect, it } from "vitest";
import { songs } from "./music";
import { songNarrative } from "./songNarrative";
import { songNarrativeMeta } from "./songNarrativeMeta";

/**
 * The eager half (meta) is duplicated on purpose so the narrative text stays
 * out of the JavaScript every page loads. These checks keep the two halves
 * from drifting apart.
 */
describe("song narrative", () => {
  it("covers every song in the catalogue", () => {
    for (const song of songs) {
      expect(songNarrative[song.slug], `narrative for ${song.slug}`).toBeDefined();
      expect(songNarrativeMeta[song.slug], `meta for ${song.slug}`).toBeDefined();
    }
  });

  it("keeps the eager meta in step with the full narrative", () => {
    for (const [slug, full] of Object.entries(songNarrative)) {
      const meta = songNarrativeMeta[slug];
      expect(meta, `meta for ${slug}`).toBeDefined();
      expect(meta.heading, `heading for ${slug}`).toBe(full.heading);
      expect(meta.artSrc, `art src for ${slug}`).toBe(full.art.src);
      expect(meta.artAlt, `art alt for ${slug}`).toBe(full.art.alt);
      expect(meta.credits, `credits for ${slug}`).toBe(full.credits);
    }
    expect(Object.keys(songNarrativeMeta).sort()).toEqual(Object.keys(songNarrative).sort());
  });

  it("never ships an em dash in public copy", () => {
    const copy = JSON.stringify(songNarrative) + JSON.stringify(songNarrativeMeta);
    expect(copy).not.toMatch(/—/);
  });

  it("keeps production-tool names out of the public story", () => {
    const copy = JSON.stringify(songNarrative) + JSON.stringify(songNarrativeMeta);
    expect(copy).not.toMatch(/\b(?:suno|ai)\b/i);
  });

  it("never claims an Ableton rebuild that has not happened", () => {
    for (const [slug, full] of Object.entries(songNarrative)) {
      expect(["planned", "in-progress", "rebuilt"], `status for ${slug}`).toContain(full.studio.status);
      expect(full.studio.note.length, `studio note for ${slug}`).toBeGreaterThan(20);
      for (const item of full.studio.instruments) {
        expect(item.name.length, `instrument name for ${slug}`).toBeGreaterThan(2);
        expect(item.role.length, `instrument role for ${slug}`).toBeGreaterThan(20);
      }
    }
  });

  it("gives every song three listening cues and a pull quote", () => {
    for (const [slug, full] of Object.entries(songNarrative)) {
      expect(full.paragraphs.length, `paragraphs for ${slug}`).toBeGreaterThanOrEqual(2);
      expect(full.cues.length, `cues for ${slug}`).toBe(3);
      expect(full.pullQuote.length, `pull quote for ${slug}`).toBeGreaterThan(8);
      expect(full.art.src).toMatch(/^\/images\/music\/songs\/[a-z0-9-]+\.webp$/);
      expect(full.art.thumbnail).toMatch(/-320\.webp$/);
      expect(full.pulse).toMatch(/-pulse\.webp$/);
    }
  });
});
