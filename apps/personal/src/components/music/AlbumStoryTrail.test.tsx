import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { albumEditorial } from "@/data/albumEditorial";
import AlbumStoryTrail from "./AlbumStoryTrail";

afterEach(cleanup);

const steps = albumEditorial["iets-moois"].trail!;
const showTrail = () => render(<AlbumStoryTrail steps={steps} />);

describe("IETS MOOIS story exploration", () => {
  it("lets the reader choose any perspective with only the selected panel exposed", () => {
    showTrail();
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    fireEvent.click(screen.getByRole("tab", { name: "De tegenstem" }));
    const panel = screen.getByRole("tabpanel");
    expect(panel.textContent).toContain("Ook twijfel heeft een stem.");
    expect(screen.getByRole("tab", { name: "De tegenstem" }).getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(screen.getByRole("tab", { name: "De tegenstem" }).id);
    expect(screen.getByRole("tab", { name: "De zekerheid" }).tabIndex).toBe(-1);
  });

  it("keeps keyboard focus and selection together, including wrapping and Home/End", () => {
    showTrail();
    const tabs = screen.getAllByRole("tab");
    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tabs[3]);
    expect(tabs[3].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(tabs[3], { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabs[0]);
    fireEvent.keyDown(tabs[0], { key: "End" });
    expect(document.activeElement).toBe(tabs[3]);
    fireEvent.keyDown(tabs[3], { key: "Home" });
    expect(document.activeElement).toBe(tabs[0]);
    expect(screen.getByRole("tabpanel").tabIndex).toBe(0);
  });

  it("provides a complete reading loop without moving the user to another page", () => {
    showTrail();
    for (const tab of screen.getAllByRole("tab")) tab.scrollIntoView = vi.fn();
    for (const label of ["De stilte", "De tegenstem", "Wat blijft"]) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`Verder: ${label.toLowerCase()}`) }));
      expect(document.activeElement).toBe(screen.getByRole("tab", { name: label }));
      expect(screen.getByRole("tab", { name: label }).getAttribute("aria-selected")).toBe("true");
      expect(screen.getByRole("tab", { name: label }).scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "instant" });
    }
    fireEvent.click(screen.getByRole("button", { name: /Terug naar het begin/ }));
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "De zekerheid" }));
    expect(screen.getByRole("tab", { name: "De zekerheid" }).scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "instant" });
    expect(screen.getByRole("tabpanel").textContent).toContain("Ooit was weten genoeg.");
  });

  it("keeps the reading experience separate from audio and private production notes", () => {
    showTrail();
    expect(screen.queryByRole("button", { name: /afspelen|play|luister/i })).toBeNull();
    const publicCopy = JSON.stringify(albumEditorial["iets-moois"]);
    expect(publicCopy).not.toMatch(/sterfbed|ongeluk|neural.?analog|suno|distrokid|LUFS|dBTP|192\s*kHz/i);
    expect(publicCopy).not.toMatch(/definitieve tracklist|Signal 0\d|release op \d/i);
  });
});
