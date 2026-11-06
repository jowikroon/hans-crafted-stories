import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AlbumShowcase from "./AlbumShowcase";

vi.mock("@/components/music/AlbumSleeve", () => ({
  default: ({ album }: { album: { slug: string } }) => <div data-testid="album-sleeve">{album.slug}</div>,
}));

describe("music album discovery", () => {
  it("provides one primary heading and direct routes without flipping artwork", () => {
    render(<MemoryRouter><AlbumShowcase /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1, name: /Twee albums/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /NEON.*4 previews.*2 singles/ }).getAttribute("href")).toBe("/music/albums/neon-the-signal-between");
    expect(screen.getByRole("link", { name: /IETS MOOIS.*4 van 12 te beluisteren/ }).getAttribute("href")).toBe("/music/albums/iets-moois");
    expect(screen.getByRole("link", { name: /Alle nummers/ }).getAttribute("href")).toBe("#songs");
    const sleeves = screen.getAllByTestId("album-sleeve");
    expect(sleeves).toHaveLength(2);
    const quickLinks = screen.getByRole("navigation", { name: "Direct naar albums en nummers" });
    // The artwork interaction must appear before the optional direct links.
    expect(sleeves[1].compareDocumentPosition(quickLinks) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
