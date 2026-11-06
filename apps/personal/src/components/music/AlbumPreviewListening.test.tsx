import { useEffect, useRef, type MutableRefObject } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import type { AlbumPreviewTrack } from "@/data/albumPreviews";
import AlbumPreviewListening from "./AlbumPreviewListening";

// Reproduce SoundCloud's real failure: a controller that posts to its iframe
// throws if the parent calls pause after React has detached that iframe.
vi.mock("./MusicPlayer", () => ({
  default: function MockSoundCloudPlayer({ song, control }: {
    song: { title: string };
    control: MutableRefObject<{ play: () => void; pause: () => void } | null>;
  }) {
    const frame = useRef<HTMLDivElement>(null);
    useEffect(() => {
      control.current = {
        play: () => undefined,
        pause: () => {
          if (!frame.current?.isConnected) {
            throw new Error("Cannot read properties of null (reading 'postMessage')");
          }
        },
      };
      // Leave the provider controller in place to model cleanup racing with
      // a detached iframe. MusicPlayer itself owns normal teardown.
    }, [control]);
    return <div ref={frame} data-testid="mock-soundcloud-player">{song.title}</div>;
  },
}));

const previews: readonly AlbumPreviewTrack[] = [
  { position: 1, title: "Preview A", duration: "2:20", soundcloudTrackId: 1, provider: "soundcloud", embed: "https://w.soundcloud.com/player/?url=preview-a" },
  { position: 2, title: "Preview B", duration: "3:10", soundcloudTrackId: 2, provider: "soundcloud", embed: "https://w.soundcloud.com/player/?url=preview-b" },
];

function albumPage(album: "iets-moois" | "neon") {
  return render(<MemoryRouter initialEntries={["/album"]}>
    <Routes>
      <Route path="/album" element={<>
        <Link to="/story">Het verhaal</Link>
        <Link to="/music">Muziek</Link>
        <AlbumPreviewListening album={album} totalTracks={album === "neon" ? 9 : 12} tracks={previews} />
      </>} />
      <Route path="/story" element={<h1>Het verhaal is geopend</h1>} />
      <Route path="/music" element={<h1>Muziek is geopend</h1>} />
    </Routes>
  </MemoryRouter>);
}

describe("album preview navigation with an active SoundCloud widget", () => {
  it.each(["iets-moois", "neon"] as const)("%s: active playback does not crash navigation to the story", (album) => {
    albumPage(album);
    fireEvent.click(screen.getByRole("button", { name: "Speel Preview A" }));
    expect(screen.getByTestId("mock-soundcloud-player")).toBeTruthy();
    expect(() => fireEvent.click(screen.getByRole("link", { name: "Het verhaal" }))).not.toThrow();
    expect(screen.getByRole("heading", { name: "Het verhaal is geopend" })).toBeTruthy();
  });

  it.each(["iets-moois", "neon"] as const)("%s: active playback does not crash returning to music", (album) => {
    albumPage(album);
    fireEvent.click(screen.getByRole("button", { name: "Speel Preview A" }));
    expect(() => fireEvent.click(screen.getByRole("link", { name: "Muziek" }))).not.toThrow();
    expect(screen.getByRole("heading", { name: "Muziek is geopend" })).toBeTruthy();
  });

  it.each(["iets-moois", "neon"] as const)("%s: switching previews then navigating is safe", (album) => {
    albumPage(album);
    fireEvent.click(screen.getByRole("button", { name: "Speel Preview A" }));
    fireEvent.click(screen.getByRole("button", { name: "Speel Preview B" }));
    expect(screen.getByTestId("mock-soundcloud-player").textContent).toBe("Preview B");
    expect(() => fireEvent.click(screen.getByRole("link", { name: "Het verhaal" }))).not.toThrow();
    expect(screen.getByRole("heading", { name: "Het verhaal is geopend" })).toBeTruthy();
  });

  it.each(["iets-moois", "neon"] as const)("%s: explicit close still restores focus before navigation", (album) => {
    albumPage(album);
    const trigger = screen.getByRole("button", { name: "Speel Preview A" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Sluit speler voor Preview A" }));
    expect(screen.queryByTestId("mock-soundcloud-player")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(screen.getByRole("link", { name: "Het verhaal" }));
    expect(screen.getByRole("heading", { name: "Het verhaal is geopend" })).toBeTruthy();
  });
});
