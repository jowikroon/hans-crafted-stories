import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "@/components/Navbar";
import Bijlagen from "@/pages/Bijlagen";
const access = vi.hoisted(() => ({ admin: true, signedIn: true, loading: false }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: access.signedIn ? { email: "hans@example.test", user_metadata: { full_name: "Hans" } } : null, signOut: vi.fn() }) }));
vi.mock("@/hooks/useAdmin", () => ({ useAdmin: () => ({ isAdmin: access.admin, loading: access.loading }) }));
vi.mock("@/hooks/useTheme", () => ({ useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }), useForcedTheme: vi.fn() }));
vi.mock("@/hooks/useLang", () => ({ useLang: () => ({ lang: "nl" }) }));
vi.mock("@/data/coworkAttachments.json", () => ({ default: [
  { name: "Rapport.pdf", size: 2048, modified: "2026-09-22T12:00:00Z", url: "/cowork/ccp-ebay-de/Rapport.pdf" },
  { name: "Privaat.docx", size: 4096, modified: "2026-09-23T12:00:00Z" },
] }));
beforeEach(() => { access.admin = true; access.signedIn = true; access.loading = false; });
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
  it("searches files without inventing public URLs for private entries", () => {
    render(<MemoryRouter><Bijlagen /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Open Rapport.pdf" })).toHaveAttribute("href", "/cowork/ccp-ebay-de/Rapport.pdf");
    expect(screen.queryByRole("link", { name: "Open Privaat.docx" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Zoek bijlagen" }), { target: { value: "privaat" } });
    expect(screen.getByText("Privaat.docx")).toBeInTheDocument();
    expect(screen.queryByText("Rapport.pdf")).not.toBeInTheDocument();
  });
  it.each(["signedOut", "nonAdmin", "loading"])("hides the collection for %s", (state) => {
    access.signedIn = state !== "signedOut";
    access.admin = state !== "nonAdmin";
    access.loading = state === "loading";
    render(<MemoryRouter><Bijlagen /></MemoryRouter>);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Rapport.pdf")).not.toBeInTheDocument();
  });
});
