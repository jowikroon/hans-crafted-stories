/**
 * Obsidian menu item: admins get a link that opens the local SecondBrainVault
 * in the Obsidian app. Non-admins must never see it.
 */
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LangProvider } from "@/hooks/useLang";

const state = vi.hoisted(() => ({ isAdmin: true }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { email: "hans@example.com", user_metadata: { full_name: "Hans" } }, signOut: vi.fn() }),
}));
vi.mock("@/hooks/useAdmin", () => ({ useAdmin: () => ({ isAdmin: state.isAdmin, loading: false }) }));

import Navbar from "./Navbar";

const renderNavbar = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <LangProvider initialLang="nl">
        <Navbar />
      </LangProvider>
    </MemoryRouter>,
  );

afterEach(cleanup);

describe("Obsidian item in the logged-in menu", () => {
  it("shows an obsidian:// link for admins in the profile menu", () => {
    state.isAdmin = true;
    renderNavbar();
    fireEvent.click(screen.getByRole("button", { name: "Profielmenu" }));
    const links = screen.getAllByRole("link", { name: /Obsidian/ });
    expect(links.some((l) => l.getAttribute("href") === "obsidian://open?vault=SecondBrainVault")).toBe(true);
  });

  it("hides the Obsidian link for logged-in non-admins", () => {
    state.isAdmin = false;
    renderNavbar();
    fireEvent.click(screen.getByRole("button", { name: "Profielmenu" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    expect(screen.queryByRole("link", { name: /Obsidian/ })).toBeNull();
  });
});
