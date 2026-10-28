import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "@/components/Navbar";
import Bijlagen from "@/pages/Bijlagen";
const access = vi.hoisted(() => ({ admin: true, signedIn: true, loading: false }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: access.signedIn ? { email: "hans@example.test", user_metadata: { full_name: "Hans" } } : null, signOut: vi.fn() }) }));
vi.mock("@/hooks/useAdmin", () => ({ useAdmin: () => ({ isAdmin: access.admin, loading: access.loading }) }));
vi.mock("@/hooks/useTheme", () => ({ useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }), useForcedTheme: vi.fn() }));
vi.mock("@/hooks/useLang", () => ({ useLang: () => ({ lang: "nl" }) }));
const backend = vi.hoisted(() => ({ read: vi.fn(), download: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ select: () => { const builder = { order: () => builder, range: backend.read }; return builder; } }),
  storage: { from: () => ({ download: backend.download }) },
} }));
beforeEach(() => {
  access.admin = true; access.signedIn = true; access.loading = false;
  backend.read.mockReset().mockResolvedValue({ data: [
    { name: "Rapport.pdf", size: 2048, modified: "2026-09-22T12:00:00Z", storage_path: "hash.pdf" },
    { name: "Privaat.docx", size: 4096, modified: "2026-09-23T12:00:00Z", storage_path: "hash.docx" },
  ], error: null });
  backend.download.mockReset().mockResolvedValue({ data: null, error: new Error("denied") });
});
afterEach(cleanup);
describe("workspace navigation", () => {
  it.each(["Profielmenu", "Toggle menu"])("shows both destinations after opening %s", (menu) => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(screen.queryByRole("link", { name: "Bijlagen" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: menu }));
    expect(screen.getByRole("link", { name: "Cowork" })).toHaveAttribute("href", "https://claude.ai/");
    expect(screen.getByRole("link", { name: "Cowork" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Bijlagen" })).toHaveAttribute("href", "/bijlagen");
  });
  it("hides admin destinations from other signed-in users", () => {
    access.admin = false;
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Profielmenu" }));
    expect(screen.queryByRole("link", { name: "Cowork" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Bijlagen" })).not.toBeInTheDocument();
  });
});
describe("Bijlagen", () => {
  it("searches private files without publishing download URLs", async () => {
    render(<MemoryRouter><Bijlagen /></MemoryRouter>);
    expect(await screen.findByRole("button", { name: "Download Rapport.pdf" })).toBeInTheDocument();
    expect(document.querySelector('a[href^="/cowork/"]')).toBeNull();
    fireEvent.change(screen.getByRole("searchbox", { name: "Zoek bijlagen" }), { target: { value: "privaat" } });
    expect(screen.getByText("Privaat.docx")).toBeInTheDocument();
    expect(screen.queryByText("Rapport.pdf")).not.toBeInTheDocument();
  });
  it("requests an authenticated download and reports denied access", async () => {
    render(<MemoryRouter><Bijlagen /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Download Rapport.pdf" }));
    await waitFor(() => expect(backend.download).toHaveBeenCalledWith("hash.pdf"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Download mislukt");
  });
  it("reports loading failures instead of claiming the collection is empty", async () => {
    backend.read.mockResolvedValue({ data: null, error: new Error("offline") });
    render(<MemoryRouter><Bijlagen /></MemoryRouter>);
    expect(await screen.findByRole("alert")).toHaveTextContent("niet worden geladen");
    expect(screen.queryByText("Er zijn nog geen bijlagen gesynchroniseerd.")).not.toBeInTheDocument();
  });
  it.each(["signedOut", "nonAdmin", "loading"])("hides the collection for %s", (state) => {
    access.signedIn = state !== "signedOut";
    access.admin = state !== "nonAdmin";
    access.loading = state === "loading";
    render(<MemoryRouter><Bijlagen /></MemoryRouter>);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Rapport.pdf")).not.toBeInTheDocument();
    expect(backend.read).not.toHaveBeenCalled();
  });
});
