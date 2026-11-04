import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { getAlbum } from "@/data/albums";
import AlbumWorld, { AlbumCompanion } from "./AlbumWorld";

afterEach(cleanup);

describe("album image stories", () => {
  it("lets a visitor explore each interpretation without exposing hidden panels", () => {
    render(<AlbumWorld album={getAlbum("iets-moois")!} />);
    expect(screen.getByRole("tabpanel").textContent).toContain("Aanwezig, zoals je bent.");
    expect(screen.getByRole("img").getAttribute("src")).toBe(getAlbum("iets-moois")!.cover);
    fireEvent.click(screen.getByRole("tab", { name: /De kleur/ }));
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.getByRole("tabpanel").textContent).toContain("Een plek om even te blijven.");
    expect(screen.getByRole("img").getAttribute("src")).toBe(getAlbum("iets-moois")!.backCover);
    expect(screen.getByRole("tab", { name: /De kleur/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: /De blik/ }).tabIndex).toBe(-1);
  });

  it("supports arrow wrapping, Home and End and moves focus with the selected tab", () => {
    render(<AlbumWorld album={getAlbum("neon-the-signal-between")!} />);
    const tabs = screen.getAllByRole("tab");
    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tabs[2]);
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(tabs[2], { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabs[0]);
    fireEvent.keyDown(tabs[0], { key: "End" });
    expect(document.activeElement).toBe(tabs[2]);
    fireEvent.keyDown(tabs[2], { key: "Home" });
    expect(document.activeElement).toBe(tabs[0]);
    const panel = screen.getByRole("tabpanel");
    expect(panel.id).toBe(tabs[0].getAttribute("aria-controls"));
    expect(panel.getAttribute("aria-labelledby")).toBe(tabs[0].id);
  });

  it.each(["iets-moois", "neon-the-signal-between"])("connects %s to the other existing album", (slug) => {
    const album = getAlbum(slug)!;
    render(<MemoryRouter><AlbumCompanion album={album} /></MemoryRouter>);
    const link = screen.getByRole("link");
    const other = slug === "iets-moois" ? "neon-the-signal-between" : "iets-moois";
    expect(link.getAttribute("href")).toBe(`/music/albums/${other}`);
  });
});
