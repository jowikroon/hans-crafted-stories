import { describe, expect, it } from "vitest";
import { featuredRelease, songs } from "./music";
import publicFeed from "./soundcloud-public.json";

describe("Jowikroon public music catalogue", () => {
  const soundcloud = songs.filter((song) => song.provider === "soundcloud");

  it("preserves one stable public recording for every verified SoundCloud ID", () => {
    const ids = soundcloud.map((song) => song.soundcloudTrackId);
    expect(ids).toHaveLength(publicFeed.tracks.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(publicFeed.tracks.map((track) => track.trackId)));
    for (const record of publicFeed.tracks) {
      const song = soundcloud.find((entry) => entry.soundcloudTrackId === record.trackId);
      expect(song?.slug).toBe(record.slug);
      expect(song?.listenUrl).toBe(record.url);
      expect(song?.date).toBe(record.uploadedAt.slice(0, 10));
      expect(song?.cover).toBe(record.artwork);
      expect(song?.duration).toBe(
        Math.floor(record.durationSeconds / 60) + ":" + String(record.durationSeconds % 60).padStart(2, "0"),
      );
    }
  });

  it("keeps all public song slugs unique and unpublished Clarity out of public SEO", () => {
    expect(new Set(songs.map((song) => song.slug)).size).toBe(songs.length);
    expect(songs.some((song) => /clarity.control/i.test(song.title))).toBe(false);
    expect(songs.every((song) => /^https:\/\//.test(song.listenUrl))).toBe(true);
  });

  it("keeps official release dates distinct from SoundCloud upload dates", () => {
    expect(songs.find((song) => song.slug === "beat-drop")?.date).toBe("2026-05-28");
    expect(songs.find((song) => song.slug === "neon-house-of-glass")?.date).toBe("2026-07-03");
    expect(featuredRelease.kicker).toBe("Latest official release");
    expect(songs.find((song) => song.slug === "beat-drop-original")?.date).toBe("2026-09-28");
  });
  it("keeps the displayed dates consistent with official releases and SoundCloud uploads", () => {
    for (const song of songs) {
      const label = song.provider === "spotify" ? "Released" : "Uploaded";
      const shownDate = new Date(`${song.date}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
      });
      expect(song.detail.facts.find((fact) => fact.label === label)?.value).toBe(shownDate);
    }
  });

  it("does not fabricate equipment or lyrics for SoundCloud recordings without approved sources", () => {
    // Deliberate review gate: verified additions require a cited source and an updated test.
    for (const song of soundcloud) {
      expect(song.detail.gear).toEqual([]);
      expect(song.detail.lyrics).toEqual([]);
    }
  });

});
