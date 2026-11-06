import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import IetsMooisPreviews from "./IetsMooisPreviews";

vi.mock("./MusicPlayer", () => ({
  default: ({ song }: { song: { title: string } }) => <div data-testid="soundcloud-widget">{song.title}</div>,
}));

describe("IETS MOOIS listening previews", () => {
  it("shows only the first four playable, with eight anonymous future slots", () => {
    const { container } = render(<IetsMooisPreviews totalTracks={12} />);
    expect(screen.getByText("4 van 12 nummers te beluisteren")).toBeTruthy();
    expect(container.querySelectorAll(".ma-track--preview")).toHaveLength(4);
    expect(container.querySelectorAll(".ma-preview__future-list li")).toHaveLength(8);
    expect(screen.getByText("Mijn opa weet alles")).toBeTruthy();
    expect(screen.getByText("Werkversie · niet definitief")).toBeTruthy();
    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    expect(screen.queryByTestId("soundcloud-widget")).toBeNull();
    expect(container.textContent).not.toMatch(/Mijn opa weet allles|secret_token/);
  });

  it("loads only the selected player after a visitor's click", () => {
    render(<IetsMooisPreviews totalTracks={12} />);
    fireEvent.click(screen.getByRole("button", { name: "Speel N = 1" }));
    expect(screen.getAllByTestId("soundcloud-widget")).toHaveLength(1);
    expect(screen.getByTestId("soundcloud-widget").textContent).toBe("N = 1");
    fireEvent.click(screen.getByRole("button", { name: "Speel Allerkleinste Dingen" }));
    expect(screen.getAllByTestId("soundcloud-widget")).toHaveLength(1);
    expect(screen.getByTestId("soundcloud-widget").textContent).toBe("Allerkleinste Dingen");
    fireEvent.click(screen.getByRole("button", { name: "Sluit speler voor Allerkleinste Dingen" }));
    expect(screen.queryByTestId("soundcloud-widget")).toBeNull();
  });

  it("shows owner-only future titles only when they are passed explicitly", () => {
    const { rerender, container } = render(<IetsMooisPreviews totalTracks={12} />);
    expect(container.textContent).not.toContain("Privéwerktitel");
    rerender(<IetsMooisPreviews totalTracks={12} ownerTracks={[{ position: 6, title: "Privéwerktitel" }]} />);
    expect(screen.getByText("Privéwerktitel")).toBeTruthy();
  });
});
