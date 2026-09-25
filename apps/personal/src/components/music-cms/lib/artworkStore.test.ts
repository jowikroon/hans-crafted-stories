import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), range: vi.fn(), signed: vi.fn(), from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  rpc: mocks.rpc,
  from: mocks.from,
  storage: { from: () => ({ createSignedUrls: mocks.signed }) },
} }));
import { listArtwork, previewUrls } from "./artworkStore";

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
