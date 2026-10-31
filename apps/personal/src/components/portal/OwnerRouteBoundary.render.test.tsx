import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import OwnerRouteBoundary from "./OwnerRouteBoundary";

const { mockUseAuth, mockUseAdmin } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseAdmin: vi.fn(),
}));

// No real Supabase client or credentials are loaded by these route tests.
vi.mock("@/hooks/useAuth", () => ({ useAuth: mockUseAuth }));
vi.mock("@/hooks/useAdmin", () => ({ useAdmin: mockUseAdmin }));

function renderRoute(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/portal" element={<p>Portal login</p>} />
        <Route
          path="*"
          element={
            <OwnerRouteBoundary>
              <p>Page content</p>
            </OwnerRouteBoundary>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OwnerRouteBoundary authentication behavior", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ loading: false });
    mockUseAdmin.mockReturnValue({ isAdmin: false, loading: false });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders public Artist Radar for an anonymous visitor", () => {
    renderRoute("/muziek/artist-radar");
    expect(screen.getByText("Page content")).toBeInTheDocument();
    expect(screen.queryByText("Portal login")).not.toBeInTheDocument();
  });

  it("does not block public Artist Radar during auth loading", () => {
    mockUseAuth.mockReturnValue({ loading: true });
    mockUseAdmin.mockReturnValue({ isAdmin: false, loading: true });
    renderRoute("/muziek/artist-radar");
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it.each(["/music-cms", "/dashboards/private", "/write"])(
    "redirects an anonymous visitor away from %s",
    (path) => {
      renderRoute(path);
      expect(screen.getByText("Portal login")).toBeInTheDocument();
      expect(screen.queryByText("Page content")).not.toBeInTheDocument();
    },
  );

  it("preserves the authentication loading gate for owner tools", () => {
    mockUseAuth.mockReturnValue({ loading: true });
    renderRoute("/music-cms");
    expect(screen.getByText("Toegang controleren…")).toBeInTheDocument();
    expect(screen.queryByText("Page content")).not.toBeInTheDocument();
  });

  it("allows an authorized owner into protected routes", () => {
    mockUseAdmin.mockReturnValue({ isAdmin: true, loading: false });
    renderRoute("/dashboards");
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});
