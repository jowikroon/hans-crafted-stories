import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, AUTH_REDIRECT_KEY, useAuth } from "./useAuth";

const mock = vi.hoisted(() => ({
  navigate: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
  listener: null as null | ((event: string, session: unknown) => void),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mock.navigate,
    useLocation: () => ({ pathname: window.location.pathname, search: window.location.search, hash: window.location.hash }),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: {
    getSession: mock.getSession,
    onAuthStateChange: mock.onAuthStateChange,
  } },
}));
vi.mock("@/lib/portalGate", () => ({ clearGateSessions: vi.fn() }));

function Reader() {
  const { user } = useAuth();
  return <output data-testid="signed-in-user">{user?.id ?? "anonymous"}</output>;
}

async function signInAfterMount() {
  render(<AuthProvider><Reader /></AuthProvider>);
  await act(async () => { await Promise.resolve(); });
  act(() => { mock.listener?.("SIGNED_IN", { user: { id: "verified-radar-user" } }); });
  act(() => { vi.advanceTimersByTime(0); });
  expect(screen.getByTestId("signed-in-user").textContent).toBe("verified-radar-user");
}

beforeEach(() => {
  vi.useFakeTimers();
  mock.navigate.mockReset();
  mock.getSession.mockReset().mockResolvedValue({ data: { session: null } });
  mock.unsubscribe.mockReset();
  mock.listener = null;
  mock.onAuthStateChange.mockReset().mockImplementation((callback) => {
    mock.listener = callback;
    return { data: { subscription: { unsubscribe: mock.unsubscribe } } };
  });
  localStorage.clear();
  window.history.replaceState({}, "", "/portal");
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

describe("AuthProvider safe post-login navigation", () => {
  it("lets an explicit verified Artist Radar callback win over a stale portal redirect", async () => {
    window.history.replaceState({}, "", "/auth/callback?artist-radar=account&code=test");
    localStorage.setItem(AUTH_REDIRECT_KEY, "/portal?view=tools");
    await signInAfterMount();
    expect(mock.navigate).not.toHaveBeenCalled(); // AuthCallback owns this fixed route.
    expect(localStorage.getItem(AUTH_REDIRECT_KEY)).toBeNull();
  });

  it("preserves normal same-origin portal return paths", async () => {
    localStorage.setItem(AUTH_REDIRECT_KEY, "/portal?view=tools#focus");
    await signInAfterMount();
    expect(mock.navigate).toHaveBeenCalledWith("/portal?view=tools#focus", { replace: true });
    expect(localStorage.getItem(AUTH_REDIRECT_KEY)).toBeNull();
  });

  it.each(["https://attacker.example", "//attacker.example", "/\\attacker.example", "/hidden\nroute"]) (
    "rejects unsafe browser-stored destination %s",
    async (unsafeRoute) => {
      localStorage.setItem(AUTH_REDIRECT_KEY, unsafeRoute);
      await signInAfterMount();
      expect(mock.navigate).not.toHaveBeenCalled();
      expect(localStorage.getItem(AUTH_REDIRECT_KEY)).toBeNull();
    },
  );

  it("keeps the existing behavior for logins with no saved destination", async () => {
    await signInAfterMount();
    expect(mock.navigate).not.toHaveBeenCalled();
  });
});
