import { describe, expect, it } from "vitest";
import { albums, albumJsonLd, albumPath, getAlbum } from "./albums";
import { songs } from "./music";

describe("public album announcements", () => {
  it("exposes the two album identities without publishing development content", () => {
    expect(albums.map(({ slug }) => slug)).toEqual(["neon-the-signal-between", "iets-moois"]);
    const allowed = ["slug", "title", "subtitle", "theme", "cover", "backCover", "description", "trackCount", "releaseYear", "publicTracks"].sort();
    for (const album of albums) {
      expect(Object.keys(album).sort()).toEqual(allowed);
      expect(album.releaseYear).toBe(2027);
      expect(album.cover).toMatch(/^\/images\/albums\/[a-z-]+\.webp$/);
      expect(album.backCover).toMatch(/^\/images\/albums\/[a-z-]+-back\.webp$/);
      expect(albumPath(album.slug)).toBe(`/music/albums/${album.slug}`);
      expect(getAlbum(album.slug)).toBe(album);
    }
    expect(getAlbum("unknown-album")).toBeUndefined();
  });

  it("makes only the two official singles playable in the album tracklists", () => {
    const neon = getAlbum("neon-the-signal-between")!;
    const warm = getAlbum("iets-moois")!;
    expect(neon.publicTracks).toEqual([
      { position: 2, songSlug: "beat-drop" },
      { position: 4, songSlug: "neon-house-of-glass" },
    ]);
    expect(warm.publicTracks).toEqual([]);
    for (const album of albums) {
      expect(new Set(album.publicTracks.map(({ position }) => position)).size).toBe(album.publicTracks.length);
      for (const { position, songSlug } of album.publicTracks) {
        expect(position).toBeGreaterThan(0);
        expect(position).toBeLessThanOrEqual(album.trackCount);
        expect(songs.find(({ slug }) => slug === songSlug)?.provider).toBe("spotify");
      }
    }
  });

  it("limits search metadata to public tracks and makes no completed-release claim", () => {
    for (const album of albums) {
      const schema = albumJsonLd(album);
      expect(schema["@type"]).toBe("MusicAlbum");
      expect(schema).not.toHaveProperty("datePublished");
      expect(schema).not.toHaveProperty("numTracks");
      expect(schema).not.toHaveProperty("brandGuide");
      expect(schema.track.map(({ name }) => name)).toEqual(album.publicTracks.map(({ songSlug }) => songs.find(({ slug }) => slug === songSlug)!.title));
      expect(schema.url).toBe(`https://hansvanleeuwen.com${albumPath(album.slug)}`);
    }
  });
});
