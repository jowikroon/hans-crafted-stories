import { describe, expect, it } from "vitest";
import { artworkVersions, EMPTY_FILTERS, filterArtwork, groupArtwork, type ArtworkAsset } from "./artworkModel";

const asset = (overrides: Partial<ArtworkAsset>): ArtworkAsset => ({
  id: "one", title: "HelloGoodbye", family_key: "hellogoodbye", album: "NEON", song: "HelloGoodbye",
  categories: ["Song"], channels: ["Instagram"], collections: ["photographic-v7"], origins: [{ collection: "photographic-v7", file: "hello.jpg", version: "v7" }],
  format: "JPG", role: "Artwork", width: 1254, height: 1254, bytes: 1024, storage_path: "originals/one.jpg", thumbnail_path: "thumbnails/one.webp", is_current: true, source_modified: "2026-09-25T00:00:00Z", ...overrides,
});

describe("artwork archive discovery", () => {
  const current = asset({});
  const old = asset({ id: "two", collections: ["illustrated-v3"], origins: [{ collection: "illustrated-v3", file: "hello.png", version: "v3" }], is_current: false, channels: ["TikTok"], format: "PNG" });
  const unrelated = asset({ id: "three", title: "Profile", family_key: "profile", song: null, categories: ["Profile"], channels: ["Spotify"] });
  it("combines song, channel and collection filters without losing earlier versions", () => {
    expect(filterArtwork([current, old, unrelated], { ...EMPTY_FILTERS, song: "HelloGoodbye", channel: "TikTok", collection: "illustrated-v3" })).toEqual([old]);
  });
  it("searches filenames and formats case-insensitively with all terms", () => {
    expect(filterArtwork([current, old], { ...EMPTY_FILTERS, search: "HELLO jpg" })).toEqual([current]);
  });
  it("keeps the default complete and distinguishes current selection from archive", () => {
    expect(filterArtwork([old, current, unrelated], EMPTY_FILTERS)).toHaveLength(3);
    expect(filterArtwork([old, current], { ...EMPTY_FILTERS, edition: "archive" })).toEqual([old]);
  });
  it("shows a song's versions across collections and formats, excluding unrelated art", () => {
    expect(artworkVersions([old, unrelated, current], old)).toEqual([current, old]);
  });
  it("does not mutate the underlying import order", () => {
    const original = [old, current]; filterArtwork(original, EMPTY_FILTERS);
    expect(original).toEqual([old, current]);
  });
  it("groups versions behind a current cover while preserving unrelated designs", () => {
    const plate = asset({ id: "plate", role: "Clean plate" });
    expect(groupArtwork([plate, old, unrelated, current])).toEqual([current, unrelated]);
  });
});
