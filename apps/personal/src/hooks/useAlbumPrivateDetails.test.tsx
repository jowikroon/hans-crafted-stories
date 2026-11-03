import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null },
  owner: { isAdmin: false, loading: false },
  from: vi.fn(),
  results: [] as Array<{ resolve: (value: unknown) => void; reject: (reason: unknown) => void; signal?: AbortSignal; album: string }>,
}));
vi.mock("./useAuth", () => ({ useAuth: () => mock.auth }));
vi.mock("./useAdmin", () => ({ useAdmin: () => mock.owner }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mock.from } }));

import { parseAlbumPrivateDetails, useAlbumPrivateDetails } from "./useAlbumPrivateDetails";

// These are synthetic canaries. Real private titles must never enter the repository.
const privateFixture = (label = "PRIVATE_CANARY_A") => ({
  story: label,
  brandGuide: "PRIVATE_GUIDE_CANARY",
  tracks: [{ position: 1, title: "PRIVATE_TRACK_CANARY", note: "In development" }],
});

beforeEach(() => {
  mock.auth.user = null;
  mock.owner.isAdmin = false;
  mock.owner.loading = false;
  mock.results.length = 0;
  mock.from.mockReset().mockImplementation(() => {
    let album = "";
    let signal: AbortSignal | undefined;
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn((_column: string, value: string) => { album = value; return builder; }),
      abortSignal: vi.fn((value: AbortSignal) => { signal = value; return builder; }),
      maybeSingle: vi.fn(() => new Promise((resolve, reject) => mock.results.push({ resolve, reject, signal, album }))),
    };
    return builder;
  });
});
afterEach(cleanup);

function owner() {
  mock.auth.user = { id: "owner-user" };
  mock.owner.isAdmin = true;
}
async function settle(index: number, data = privateFixture()) {
  await act(async () => { mock.results[index].resolve({ data: { details: data }, error: null }); });
}

describe("owner-only album details", () => {
  it("never requests private rows for anonymous visitors, other members or an unverified owner", () => {
    const { result, rerender } = renderHook(() => useAlbumPrivateDetails("neon-the-signal-between"));
    expect(result.current.details).toBeNull();
    mock.auth.user = { id: "ordinary-member" };
    rerender();
    owner();
    mock.owner.loading = true;
    rerender();
    expect(mock.from).not.toHaveBeenCalled();
    expect(result.current.isOwner).toBe(false);
    expect(result.current.details).toBeNull();
  });

  it("loads owner data only after the ownership check completes", async () => {
    owner();
    const { result } = renderHook(() => useAlbumPrivateDetails("neon-the-signal-between"));
    expect(mock.from).toHaveBeenCalledWith("music_album_private_details");
    expect(mock.results[0].album).toBe("neon-the-signal-between");
    expect(result.current.details).toBeNull();
    expect(result.current.loading).toBe(true);
    await settle(0);
    expect(result.current.details).toEqual(privateFixture());
    expect(result.current.error).toBe(false);
  });

  it("removes already-visible private details immediately when the owner signs out", async () => {
    owner();
    const { result, rerender } = renderHook(() => useAlbumPrivateDetails("neon-the-signal-between"));
    await settle(0);
    expect(result.current.details).not.toBeNull();
    mock.auth.user = null;
    mock.owner.isAdmin = false;
    rerender();
    expect(result.current.details).toBeNull();
    expect(result.current.isOwner).toBe(false);
    expect(mock.results[0].signal?.aborted).toBe(true);
  });

  it("ignores a late private response after an account switch", async () => {
    owner();
    const { result, rerender } = renderHook(() => useAlbumPrivateDetails("neon-the-signal-between"));
    mock.auth.user = { id: "other-member" };
    mock.owner.isAdmin = false;
    rerender();
    await settle(0);
    expect(result.current.details).toBeNull();
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.results[0].signal?.aborted).toBe(true);
  });

  it("never shows the previous album's details during a route switch", async () => {
    owner();
    const { result, rerender } = renderHook(({ slug }) => useAlbumPrivateDetails(slug), { initialProps: { slug: "neon-the-signal-between" } });
    await settle(0);
    rerender({ slug: "iets-moois" });
    expect(result.current.details).toBeNull();
    expect(result.current.loading).toBe(true);
    await settle(1, privateFixture("PRIVATE_CANARY_B"));
    expect(result.current.details?.story).toBe("PRIVATE_CANARY_B");
  });

  it("fails closed for a missing table, a missing row and a malformed response", async () => {
    owner();
    const { result, rerender } = renderHook(({ slug }) => useAlbumPrivateDetails(slug), { initialProps: { slug: "neon-the-signal-between" } });
    await act(async () => { mock.results[0].resolve({ data: null, error: { code: "42P01" } }); });
    expect(result.current.error).toBe(true);
    expect(result.current.details).toBeNull();
    rerender({ slug: "iets-moois" });
    await act(async () => { mock.results[1].resolve({ data: null, error: null }); });
    expect(result.current.error).toBe(true);
    expect(result.current.details).toBeNull();
    rerender({ slug: "neon-the-signal-between" });
    await act(async () => { mock.results[2].resolve({ data: { details: { story: "invalid" } }, error: null }); });
    expect(result.current.error).toBe(true);
    expect(result.current.details).toBeNull();
  });

  it("fails closed after a rejected network request without retaining data", async () => {
    owner();
    const { result } = renderHook(() => useAlbumPrivateDetails("neon-the-signal-between"));
    await act(async () => { mock.results[0].reject(new Error("network unavailable")); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.details).toBeNull();
    expect(result.current.error).toBe(true);
  });

  it("removes data if ownership is revoked while the same account stays signed in", async () => {
    owner();
    const { result, rerender } = renderHook(() => useAlbumPrivateDetails("neon-the-signal-between"));
    await settle(0);
    mock.owner.isAdmin = false;
    rerender();
    expect(result.current.details).toBeNull();
    expect(result.current.isOwner).toBe(false);
  });
});

describe("private response validation", () => {
  it("rejects duplicate or invalid positions and malformed fields", () => {
    const sample = privateFixture();
    expect(parseAlbumPrivateDetails({ ...sample, tracks: [{ position: 1, title: "A" }, { position: 1, title: "B" }] })).toBeNull();
    expect(parseAlbumPrivateDetails({ ...sample, tracks: [{ position: 0, title: "A" }] })).toBeNull();
    expect(parseAlbumPrivateDetails({ ...sample, tracks: [{ position: 1.5, title: "A" }] })).toBeNull();
    expect(parseAlbumPrivateDetails({ ...sample, tracks: [{ position: 1, title: "A", note: {} }] })).toBeNull();
    expect(parseAlbumPrivateDetails(null)).toBeNull();
  });

  it("strips unexpected fields rather than forwarding server payloads to the UI", () => {
    const sample = privateFixture();
    expect(parseAlbumPrivateDetails({ ...sample, internalUrl: "secret", tracks: [{ ...sample.tracks[0], internalUrl: "secret" }] })).toEqual(sample);
  });
});
