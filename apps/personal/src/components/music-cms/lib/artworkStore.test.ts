import { Blob as NodeBlob } from "node:buffer";
import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), range: vi.fn(), signed: vi.fn(), single: vi.fn(), from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  rpc: mocks.rpc,
  from: mocks.from,
  storage: { from: () => ({ createSignedUrls: mocks.signed, createSignedUrl: mocks.single }) },
} }));
import { listArtwork, previewUrls, playbackUrl, originalVideoBlob } from "./artworkStore";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockReturnValue({ select: () => ({ order: () => ({ range: mocks.range }) }) });
});

describe("private artwork store", () => {
  it("does not query artwork for a non-admin", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    await expect(listArtwork()).rejects.toThrow("admin-account");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("loads beyond the API row limit instead of silently truncating the archive", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.range.mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, i) => ({ id: String(i) })), error: null }).mockResolvedValueOnce({ data: [{ id: "last" }], error: null });
    expect(await listArtwork()).toHaveLength(501);
    expect(mocks.range).toHaveBeenNthCalledWith(2, 500, 999);
  });
  it("does not request original files when the preview list is empty", async () => {
    expect(await previewUrls([])).toEqual({}); expect(mocks.signed).not.toHaveBeenCalled();
  });
});


describe("private video playback", () => {
  it("signs only the selected playback copy, never the large original", async () => {
    mocks.single.mockResolvedValue({ data: { signedUrl: "https://example.test/preview" }, error: null });
    const asset = { media_type: "video", playback_path: "videos/previews/one.mp4", storage_path: "videos/originals/one.mp4" } as import("./artworkModel").ArtworkAsset;
    expect(await playbackUrl(asset)).toBe("https://example.test/preview");
    expect(mocks.single).toHaveBeenCalledWith(asset.playback_path, 3600);
    expect(mocks.single).toHaveBeenCalledTimes(1);
  });
  it("does not sign images as playable videos", async () => {
    await expect(playbackUrl({ media_type: "image" } as import("./artworkModel").ArtworkAsset)).rejects.toThrow("Geen videopreview");
    expect(mocks.single).not.toHaveBeenCalled();
  });
  it("rejects missing original parts before offering an incomplete download", async () => {
    await expect(originalVideoBlob({ original_parts: [] } as unknown as import("./artworkModel").ArtworkAsset)).rejects.toThrow("Geen originele");
  });
});


afterEach(() => vi.unstubAllGlobals());
describe("lossless original video downloads", () => {
  const parts = [new Uint8Array([1, 2]), new Uint8Array([3, 4])];
  const asset = { id: createHash("sha256").update(new Uint8Array([1, 2, 3, 4])).digest("hex"), bytes: 4, original_parts: ["part/000", "part/001"] } as import("./artworkModel").ArtworkAsset;
  beforeEach(() => {
    vi.stubGlobal("Blob", NodeBlob);
    vi.stubGlobal("crypto", webcrypto);
    mocks.single.mockImplementation((path: string) => Promise.resolve({ data: { signedUrl: path }, error: null }));
  });
  it("reassembles ordered parts and verifies the original SHA-256 before download", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, arrayBuffer: async () => parts[0].buffer }).mockResolvedValueOnce({ ok: true, arrayBuffer: async () => parts[1].buffer });
    vi.stubGlobal("fetch", fetcher);
    const progress = vi.fn();
    const blob = await originalVideoBlob(asset, progress);
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual([1, 2, 3, 4]);
    expect(fetcher.mock.calls.map(call => call[0])).toEqual(asset.original_parts);
    expect(progress).toHaveBeenLastCalledWith(100);
  });
  it("rejects corrupted parts even when their total size is correct", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => parts[0].buffer }));
    await expect(originalVideoBlob(asset)).rejects.toThrow("Bestandscontrole");
  });
  it("stops on a failed part instead of saving a truncated video", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(originalVideoBlob(asset)).rejects.toThrow("Download onderbroken");
  });
});
