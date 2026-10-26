import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), range: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: mock }));
import { listDevelopmentPages } from "./developmentStore";

beforeEach(() => {
  vi.resetAllMocks();
  mock.rpc.mockResolvedValue({ data: true, error: null });
  const query = { select: vi.fn(), order: vi.fn(), range: mock.range };
  query.select.mockReturnValue(query);
  query.order.mockReturnValue(query);
  mock.from.mockReturnValue(query);
});

describe("private development catalogue access", () => {
  it("never requests private rows when the admin check is denied", async () => {
    mock.rpc.mockResolvedValue({ data: false, error: null });
    await expect(listDevelopmentPages()).rejects.toThrow("admin-account");
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("fails closed when the access check fails", async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: "offline" } });
    await expect(listDevelopmentPages()).rejects.toThrow("admin-account");
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("retrieves all versions beyond the server page size", async () => {
    mock.range.mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, id) => ({ id: String(id) })), error: null })
      .mockResolvedValueOnce({ data: [{ id: "last" }], error: null });
    expect(await listDevelopmentPages()).toHaveLength(501);
    expect(mock.range).toHaveBeenNthCalledWith(2, 500, 999);
  });
  it.each(["42P01", "PGRST205"])("explains pending setup for %s without blocking the artwork", async (code) => {
    mock.range.mockResolvedValue({ data: null, error: { code } });
    await expect(listDevelopmentPages()).rejects.toThrow("Beeldbank blijft hieronder beschikbaar");
  });
});
