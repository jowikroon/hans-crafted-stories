import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthCallback from "./AuthCallback";

const mock = vi.hoisted(() => ({
  navigate: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
  sessionListener: null as null | ((event: string, session: unknown) => void),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mock.navigate };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: {
    getSession: mock.getSession,
    onAuthStateChange: mock.onAuthStateChange,
  } },
}));

beforeEach(() => {
  vi.useFakeTimers();
  mock.navigate.mockReset();
  mock.unsubscribe.mockReset();
  mock.getSession.mockReset().mockResolvedValue({ data: { session: null } });
  mock.sessionListener = null;
  mock.onAuthStateChange.mockReset().mockImplementation((listener) => {
    mock.sessionListener = listener;
    return { data: { subscription: { unsubscribe: mock.unsubscribe } } };
  });
  window.history.replaceState({}, "", "/auth/callback");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Artist Radar e-mail authentication callback", () => {
  it("returns a confirmed radar session to the account overlay, including across devices", async () => {
    window.history.replaceState({}, "", "/auth/callback?artist-radar=account&code=an-example-code");
    render(<AuthCallback />);
    expect(mock.onAuthStateChange).toHaveBeenCalledOnce();

    await act(async () => { mock.sessionListener?.("SIGNED_IN", { user: { id: "verified-user" } }); });
    act(() => { vi.advanceTimersByTime(0); });
    expect(mock.navigate).toHaveBeenCalledWith("/music?artist-radar=account", { replace: true });
    expect(mock.navigate).not.toHaveBeenCalledWith("/portal", expect.anything());
  });

  it("recovers an already established session even if it missed the auth event", async () => {
    window.history.replaceState({}, "", "/auth/callback?artist-radar=account");
    mock.getSession.mockResolvedValue({ data: { session: { user: { id: "already-signed-in" } } } });
    render(<AuthCallback />);
    await act(async () => { await Promise.resolve(); });
    act(() => { vi.advanceTimersByTime(0); });
    expect(mock.navigate).toHaveBeenCalledWith("/music?artist-radar=account", { replace: true });
  });

  it("does not claim success for a missing or expired session", async () => {
    window.history.replaceState({}, "", "/auth/callback?artist-radar=account#error=access_denied");
    render(<AuthCallback />);
    await act(async () => { await Promise.resolve(); });
    act(() => { vi.advanceTimersByTime(12000); });
    expect(mock.navigate).toHaveBeenCalledWith("/music?artist-radar=account&auth=retry", { replace: true });
    expect(mock.navigate).not.toHaveBeenCalledWith("/music?artist-radar=account", expect.anything());
  });

  it("never accepts a user-supplied destination as an open redirect", async () => {
    window.history.replaceState({}, "", "/auth/callback?artist-radar=//attacker.example&next=https%3A%2F%2Fattacker.example");
    render(<AuthCallback />);
    await act(async () => { await Promise.resolve(); });
    act(() => { vi.advanceTimersByTime(800); });
    expect(mock.onAuthStateChange).not.toHaveBeenCalled();
    expect(mock.navigate).toHaveBeenCalledWith("/portal", { replace: true });
  });

  it("keeps the pre-existing portal callback behavior and removes radar listeners on close", async () => {
    render(<AuthCallback />);
    await act(async () => { await Promise.resolve(); });
    act(() => { vi.advanceTimersByTime(800); });
    expect(mock.navigate).toHaveBeenCalledWith("/portal", { replace: true });

    cleanup();
    mock.navigate.mockClear();
    window.history.replaceState({}, "", "/auth/callback?artist-radar=account");
    render(<AuthCallback />);
    cleanup();
    act(() => { vi.advanceTimersByTime(12000); });
    expect(mock.unsubscribe).toHaveBeenCalledOnce();
    expect(mock.navigate).not.toHaveBeenCalled();
  });
});
