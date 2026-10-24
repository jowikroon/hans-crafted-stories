import { act, fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import MusicProductionMenu from "./MusicProductionMenu";

afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("music production navigation", () => {
  it("reveals the three destinations on hover and keeps a grace period", () => {
    vi.useFakeTimers();
    render(<MemoryRouter><MusicProductionMenu onNavigate={() => {}} /></MemoryRouter>);
    const button = screen.getByRole("button", { name: "Muziekproductie" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.mouseEnter(button.parentElement!);
    expect(screen.getByRole("link", { name: "Beeldbank" })).toHaveAttribute("href", "/music-cms?mode=artwork");
    expect(screen.getByRole("link", { name: "NEON" })).toHaveAttribute("href", "/music-cms?mode=neon");
    expect(screen.getByRole("link", { name: "Songwriter" })).toHaveAttribute("href", "/music-cms?mode=write");
    fireEvent.mouseLeave(button.parentElement!);
    expect(screen.getByRole("link", { name: "NEON" })).toBeInTheDocument();
    fireEvent.mouseEnter(button.parentElement!);
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByRole("link", { name: "NEON" })).toBeInTheDocument();
  });
  it("opens by click on mobile, navigates and restores focus with Escape", () => {
    const navigate = vi.fn();
    render(<MemoryRouter><MusicProductionMenu mobile onNavigate={navigate} /></MemoryRouter>);
    const button = screen.getByRole("button", { name: "Muziekproductie" });
    fireEvent.click(button);
    fireEvent.keyDown(screen.getByRole("link", { name: "NEON" }), { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("link", { name: "Songwriter" }));
    expect(navigate).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
  it("pins a hover-open submenu on pointer click instead of closing it", () => {
    vi.useFakeTimers();
    render(<MemoryRouter initialEntries={["/music-cms?mode=neon"]}><MusicProductionMenu onNavigate={() => {}} /></MemoryRouter>);
    const button = screen.getByRole("button", { name: "Muziekproductie" });
    fireEvent.mouseEnter(button.parentElement!);
    fireEvent.click(button, { detail: 1 });
    fireEvent.mouseLeave(button.parentElement!);
    act(() => vi.advanceTimersByTime(300));
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "NEON" })).toHaveAttribute("aria-current", "page");
    fireEvent.pointerDown(document.body);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
  it("moves keyboard focus into the menu and closes when focus leaves", async () => {
    render(<MemoryRouter><MusicProductionMenu onNavigate={() => {}} /></MemoryRouter>);
    const button = screen.getByRole("button", { name: "Muziekproductie" });
    fireEvent.keyDown(button, { key: "ArrowDown" });
    await waitFor(() => expect(screen.getByRole("link", { name: "Beeldbank" })).toHaveFocus());
    fireEvent.blur(screen.getByRole("link", { name: "Beeldbank" }), { relatedTarget: document.body });
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
