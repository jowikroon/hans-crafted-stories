import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { publicAlbumForSong } from "./albums";
import { songs } from "./music";
import { getSongNarrative, songNarrative } from "./songNarrative";

const publicRoot = path.resolve(process.cwd(), "public");

describe("single public song narrative layer", () => {
  it("covers precisely the nine established public song routes", () => {
    expect(Object.keys(songNarrative).sort()).toEqual(songs.map((song) => song.slug).sort());
    expect(songs).toHaveLength(9);
    expect(getSongNarrative("new-level")).toBeUndefined();
    expect(getSongNarrative("pressure")).toBeUndefined();
  });

  it.each(songs)("provides unique interpretation and three cues for $title", ({ slug }) => {
    const story = getSongNarrative(slug)!;
    expect(story.heading.length).toBeGreaterThan(7);
    expect(story.emotion.length).toBeGreaterThan(7);
    expect(story.subline.length).toBeGreaterThan(7);
    expect(Object.keys(story.triptych).sort()).toEqual(["i", "it", "you"]);
    expect(Object.values(story.triptych).every(Boolean)).toBe(true);
    expect(story.paragraphs).toHaveLength(2);
    expect(story.listening).toHaveLength(3);
    for (const image of [story.art.src, story.art.thumbnail, story.art.pulse]) {
      expect(image).toMatch(/^\/images\/music\/songs\/[a-z0-9-]+\.webp$/);
      expect(existsSync(path.join(publicRoot, image.slice(1)))).toBe(true);
    }
    expect(story.art.alt.length).toBeGreaterThan(20);
  });

  it("keeps production claims out of poetic listening invitations", () => {
    const editorialCopy = Object.values(songNarrative).flatMap((story) => [
      story.heading, story.emotion, story.subline, ...Object.values(story.triptych),
      ...story.paragraphs, ...story.listening,
    ]).join(" ");
    expect(editorialCopy).not.toMatch(/\b(?:Ableton|LUFS|dBTP|\d+\s*kHz|\d+\s*BPM|unquantised|Mongolian throat|cowbells)\b/i);
    expect(editorialCopy).not.toContain("—");
  });

  it("distinguishes official album links from adjacent public recordings", () => {
    const known = songs.filter((song) => publicAlbumForSong(song.slug)).map((song) => song.slug).sort();
    expect(known).toEqual(["beat-drop", "neon-house-of-glass"]);
    expect(songNarrative["78-thz-texture"].world).toBe("standalone");
    expect(songNarrative["beat-drop-original"].world).toBe("standalone");
  });

  it("retains the four already published triptych readings from main", () => {
    expect(songNarrative["neon-house-of-glass"].triptych.i).toBe("I can see a thousand hearts. The room is still quiet.");
    expect(songNarrative["beat-drop"].triptych.i).toBe("I wore one song out alone.");
    expect(songNarrative["hanging-on"].triptych.i).toBe("I say I cannot keep hanging on.");
    expect(songNarrative["that-spark"].triptych.i).toBe("I notice a flicker before I know what it means.");
  });
});
