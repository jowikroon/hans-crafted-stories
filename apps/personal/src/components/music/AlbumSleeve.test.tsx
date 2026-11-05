import { useState } from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { getAlbum, type MusicAlbumData } from "@/data/albums";
import AlbumSleeve from "./AlbumSleeve";

// No backend or private owner data is needed to prove the public motion contract.
vi.mock("./MusicExperience", () => ({ useMusicExperience: () => ({ openSong: vi.fn() }) }));
vi.mock("@/hooks/useAlbumPrivateDetails", () => ({ useAlbumPrivateDetails: () => ({ details: null }) }));

function SleeveHarness({ album }: { album: MusicAlbumData }) {
  const [open, setOpen] = useState(false);
  return <AlbumSleeve album={album} open={open} onToggle={() => setOpen((current) => !current)} />;
}

function openSleeve(slug: "neon-the-signal-between" | "iets-moois", detail = 1) {
  const album = getAlbum(slug);
  if (!album) throw new Error("Unknown test album");
  const view = render(<MemoryRouter><SleeveHarness album={album} /></MemoryRouter>);
  const front = screen.getByRole("button", { name: `Draai ${album.subtitle ? `${album.title}: ${album.subtitle}` : album.title} om: bekijk de achterkant` });
  fireEvent.click(front, { detail });
  const rows = Array.from(view.container.querySelectorAll<HTMLElement>(".ma-sleeve__track-row"));
  return { ...view, front, rows, card: view.container.querySelector<HTMLElement>(".ma-album-card")! };
}

describe("Jowikroon album motion contract", () => {
  it("turns NEON with the full nine-row slow-to-fast cascade", () => {
    const { rows, card } = openSleeve("neon-the-signal-between");
    expect(card.getAttribute("data-open")).toBe("true");
    expect(card.getAttribute("data-instant")).toBe("false");
    expect(rows).toHaveLength(9);
    const delays = rows.map((row) => Number.parseInt(row.style.getPropertyValue("--ma-reveal-delay"), 10));
    expect(delays).toEqual([920, 1370, 1720, 1960, 2140, 2280, 2390, 2480, 2560]);
    const gaps = delays.slice(1).map((value, i) => value - delays[i]);
    expect(gaps).toEqual([450, 350, 240, 180, 140, 110, 90, 80]);
    expect(screen.getByRole("link", { name: /Open songpagina van Beat Drop/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open songpagina van Neon House of Glass/ })).toBeTruthy();
  });

  it("also animates five anonymous, unreleased IETS MOOIS positions", () => {
    const { rows, container, card } = openSleeve("iets-moois");
    expect(card.getAttribute("data-open")).toBe("true");
    expect(rows).toHaveLength(5);
    expect(container.querySelectorAll(".ma-blur-mark")).toHaveLength(5);
    expect(container.querySelectorAll(".ma-sleeve__back-quote")).toHaveLength(0);
    expect(container.querySelectorAll(".ma-sleeve__track-row--released")).toHaveLength(0);
    expect(rows[0].style.getPropertyValue("--ma-reveal-delay")).toBe("920ms");
  });

  it("replays when the cover is reopened and closes with Escape", () => {
    const { card, front } = openSleeve("neon-the-signal-between");
    fireEvent.keyDown(card, { key: "Escape" });
    expect(card.getAttribute("data-open")).toBe("false");
    fireEvent.click(front, { detail: 1 });
    expect(card.getAttribute("data-open")).toBe("true");
    expect(card.getAttribute("data-instant")).toBe("false");
  });

  it("reveals immediately for keyboard activation and Tab navigation", () => {
    const { card } = openSleeve("neon-the-signal-between", 0);
    expect(card.getAttribute("data-instant")).toBe("true");
    fireEvent.keyDown(card, { key: "Escape" });
    const front = screen.getByRole("button", { name: /Draai NEON.*om/ });
    fireEvent.click(front, { detail: 1 });
    expect(card.getAttribute("data-instant")).toBe("false");
    fireEvent.keyDown(card, { key: "Tab" });
    expect(card.getAttribute("data-instant")).toBe("true");
  });

  it("guards CSS flip duration, track animation and reduced-motion fallback", () => {
    const css = readFileSync(new URL("../../styles/music-albums.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.ma-sleeve\s*\{[^}]*transition:transform 760ms/);
    expect(css).toMatch(/\.ma-album-card\[data-open=true\] \.ma-sleeve \{ transform:rotateY\(180deg\); \}/);
    expect(css).toMatch(/\.ma-album-card\[data-open=true\] \.ma-sleeve__track-row \{ animation:ma-track-arrive 360ms/);
    expect(css).toMatch(/@media\(prefers-reduced-motion:reduce\)[\s\S]*\.ma-album-card\[data-open=true\] \.ma-sleeve__track-row \{ opacity:1/);
  });
});
