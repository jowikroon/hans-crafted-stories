import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import ArtistRadarVisual from "./ArtistRadarVisual";

let schedule: ReturnType<typeof vi.fn>;
let cancel: ReturnType<typeof vi.fn>;

beforeEach(() => {
  schedule = vi.fn(() => 41);
  cancel = vi.fn();
  vi.stubGlobal("requestAnimationFrame", schedule);
  vi.stubGlobal("cancelAnimationFrame", cancel);
  vi.stubGlobal("IntersectionObserver", undefined);
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ArtistRadarVisual lifecycle", () => {
  it("never starts an animation frame when inactive", () => {
    const { container } = render(<ArtistRadarVisual active={false} />);
    expect(container.querySelector(".arv")?.getAttribute("data-active")).toBe("false");
    expect(schedule).not.toHaveBeenCalled();
  });

  it("starts one animation loop and cancels it on unmount", () => {
    const { container, unmount } = render(<ArtistRadarVisual active />);
    expect(container.querySelector(".arv")?.getAttribute("data-active")).toBe("true");
    expect(schedule).toHaveBeenCalledTimes(1);
    unmount();
    expect(cancel).toHaveBeenCalledWith(41);
  });

  it("pauses the loop as soon as the dialog deactivates it", () => {
    const { rerender } = render(<ArtistRadarVisual active />);
    rerender(<ArtistRadarVisual active={false} />);
    expect(cancel).toHaveBeenCalledWith(41);
    expect(schedule).toHaveBeenCalledTimes(1);
    rerender(<ArtistRadarVisual active />);
    expect(schedule).toHaveBeenCalledTimes(2);
  });

  it("respects the user's reduced-motion preference", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    render(<ArtistRadarVisual active />);
    expect(schedule).not.toHaveBeenCalled();
  });

  it("assigns distinct SVG gradient ids to simultaneous radar instances", () => {
    const { container } = render(<><ArtistRadarVisual active={false} /><ArtistRadarVisual active={false} /></>);
    const ids = [...container.querySelectorAll("linearGradient[id], radialGradient[id]")]
      .map((element) => element.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
