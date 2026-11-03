import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import ClarityStudioPreview from "./ClarityStudioPreview";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  getSession: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({
  AUTH_REDIRECT_KEY: "auth_redirect_after_login",
  useAuth: mocks.useAuth,
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: mocks.getSession } },
}));
vi.mock("@/components/LocalizedLink", () => ({
  Link: ({ to, children, ...props }: {
    to: string; children: ReactNode; onClick?: () => void; className?: string;
  }) => <a href={to} {...props}>{children}</a>,
}));

const user = { id: "invited-test-user" };
const signedIn = { user, session: { user }, loading: false };

beforeEach(() => {
  mocks.useAuth.mockReset();
  mocks.getSession.mockReset();
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("ClarityStudioPreview secure progressive enhancement", () => {
  it("renders the original NEON placeholder when the release flag is off", () => {
    mocks.useAuth.mockReturnValue(signedIn);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ClarityStudioPreview previewReady={false} />);
    expect(screen.getByText("First listen in preparation")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /listen to the preview/i })).toBeNull();
    expect(screen.queryByLabelText(/private audio preview/i)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks anonymous visitors to sign in but never exposes an audio URL", () => {
    mocks.useAuth.mockReturnValue({ user: null, session: null, loading: false });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ClarityStudioPreview previewReady />);
    expect(screen.getByRole("link", { name: /sign in for first listen/i }).getAttribute("href"))
      .toBe("/portal");
    expect(screen.queryByRole("button", { name: /listen to the preview/i })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("honors server-side denial even for a signed-in website account", async () => {
    mocks.useAuth.mockReturnValue(signedIn);
    mocks.getSession.mockResolvedValue({ data: { session: { access_token: "sample-jwt" } } });
    const fetchMock = vi.fn().mockResolvedValue({ status: 403, ok: false });
    vi.stubGlobal("fetch", fetchMock);
    render(<ClarityStudioPreview previewReady />);
    fireEvent.click(screen.getByRole("button", { name: /listen to the preview/i }));
    await waitFor(() => expect(screen.getByRole("alert").textContent)
      .toContain("personal invitation"));
    expect(screen.queryByLabelText(/private audio preview/i)).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/functions/v1/neon-studio-preview",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
  });
});
