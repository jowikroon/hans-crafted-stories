import { describe, expect, it } from "vitest";
import { albums, albumJsonLd, albumPath, getAlbum } from "./albums";
import { songs } from "./music";
import { ietsMooisPreviews } from "./ietsMooisPreviews";

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

  it("keeps official singles separate from the four IETS MOOIS website previews", () => {
    const neon = getAlbum("neon-the-signal-between")!;
    const warm = getAlbum("iets-moois")!;
    expect(neon.publicTracks).toEqual([
      { position: 2, songSlug: "beat-drop" },
      { position: 4, songSlug: "neon-house-of-glass" },
    ]);
    expect(warm.publicTracks).toEqual([]);
    expect(warm.trackCount).toBe(12);
    expect(ietsMooisPreviews.map(({ position, title }) => ({ position, title }))).toEqual([
      { position: 1, title: "N = 1" },
      { position: 2, title: "Mijn opa weet alles" },
      { position: 3, title: "Allerkleinste Dingen" },
      { position: 4, title: "Hypnotisch" },
    ]);
    expect(ietsMooisPreviews[3].versionNote).toMatch(/niet definitief/);
    for (const preview of ietsMooisPreviews) {
      const player = new URL(preview.embed);
      const recording = new URL(player.searchParams.get("url")!);
      expect(player.host).toBe("w.soundcloud.com");
      expect(recording.pathname).toContain(String(preview.soundcloudTrackId));
      expect(recording.searchParams.get("secret_token")).toMatch(/^s-/);
      expect(preview.position).toBeLessThanOrEqual(warm.trackCount);
    }
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

  it("does not publish private SoundCloud links in the album schema", () => {
    const schema = albumJsonLd(getAlbum("iets-moois")!);
    expect(schema.track).toEqual([]);
    expect(JSON.stringify(schema)).not.toMatch(/secret_token|soundcloud:tracks/);
  });
});
