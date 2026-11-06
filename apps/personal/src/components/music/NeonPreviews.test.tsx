import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NeonPreviews from "./NeonPreviews";

const experience = vi.hoisted(() => ({
  active: null as null | { slug: string; placement: string },
  stop: vi.fn(),
}));

vi.mock("./MusicExperience", () => ({ useMusicExperience: () => experience }));
vi.mock("./MusicPlayer", () => ({
  default: ({ song }: { song: { title: string } }) => <div data-testid="soundcloud-widget">{song.title}</div>,
}));

function preview() {
  return render(<MemoryRouter><NeonPreviews totalTracks={9} /></MemoryRouter>);
}

describe("NEON Official private website previews", () => {
  it("shows the exact first four in playlist order, distinct from the nine album positions", () => {
    const { container } = preview();
    expect(screen.getByRole("heading", { name: "Het signaal wordt hoorbaar." })).toBeTruthy();
    expect(screen.getByText("4 privé-opnamen uit de playlist")).toBeTruthy();
    expect(container.querySelectorAll(".ma-track--preview")).toHaveLength(4);
    expect(Array.from(container.querySelectorAll(".ma-track--preview strong")).map((el) => el.textContent)).toEqual([
      "New Level", "Beat Drop", "Neon House of Glass", "Pressure",
    ]);
    expect(screen.getByText(/NEON heeft 9 geplande albumposities/)).toBeTruthy();
    expect(container.querySelectorAll(".ma-preview__future-list li")).toHaveLength(0);
    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    expect(container.textContent).not.toMatch(/secret_token|That Spark|The Vow/);
  });

  it("starts only on click, stops an existing Spotify player, and keeps just one SoundCloud widget", () => {
    experience.stop.mockClear();
    preview();
    fireEvent.click(screen.getByRole("button", { name: "Speel New Level" }));
    expect(experience.stop).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId("soundcloud-widget")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Speel Pressure" }));
    expect(experience.stop).toHaveBeenCalledTimes(2);
    expect(screen.getAllByTestId("soundcloud-widget")).toHaveLength(1);
    expect(screen.getByTestId("soundcloud-widget").textContent).toBe("Pressure");
  });

  it("closes the preview for an official Spotify selection and restores focus on close", () => {
    experience.active = null;
    const { rerender } = preview();
    const trigger = screen.getByRole("button", { name: "Speel Beat Drop" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Sluit speler voor Beat Drop" }));
    expect(document.activeElement).toBe(trigger);
    expect(screen.queryByTestId("soundcloud-widget")).toBeNull();
    fireEvent.click(trigger);
    expect(screen.getByTestId("soundcloud-widget")).toBeTruthy();
    experience.active = { slug: "beat-drop", placement: "album-beat-drop" };
    rerender(<MemoryRouter><NeonPreviews totalTracks={9} /></MemoryRouter>);
    expect(screen.queryByTestId("soundcloud-widget")).toBeNull();
    experience.active = null;
  });
});
