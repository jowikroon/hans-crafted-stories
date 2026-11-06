import { afterEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import type { MutableRefObject } from "react";
import MusicPlayer from "./MusicPlayer";

afterEach(() => vi.unstubAllGlobals());

describe("SoundCloud controller lifecycle", () => {
  it("never sends pause to an iframe already detached by navigation", async () => {
    const pause = vi.fn();
    const play = vi.fn();
    const handlers = new Map<string, () => void>();
    const widget = Object.assign(vi.fn(() => ({
      play, pause,
      bind: vi.fn((event: string, callback: () => void) => { handlers.set(event, callback); }),
      unbind: vi.fn(),
    })), {
      Events: { READY: "READY", PLAY: "PLAY", PAUSE: "PAUSE", FINISH: "FINISH", ERROR: "ERROR" },
    });
    vi.stubGlobal("SC", { Widget: widget });

    const control: MutableRefObject<{ play: () => void; pause: () => void } | null> = { current: null };
    const { container, unmount } = render(<MusicPlayer
      song={{ title: "Safe SoundCloud preview", provider: "soundcloud", embed: "https://w.soundcloud.com/player/?url=example" }}
      onStatus={vi.fn()} control={control}
    />);

    await waitFor(() => expect(control.current).not.toBeNull());
    const frame = container.querySelector("iframe");
    expect(frame?.isConnected).toBe(true);
    control.current?.pause();
    expect(pause).toHaveBeenCalledTimes(1);

    frame?.remove();
    expect(() => control.current?.pause()).not.toThrow();
    expect(pause).toHaveBeenCalledTimes(1);
    // READY may arrive after the iframe has been detached but before the
    // component's passive cleanup; it must not restart a removed widget.
    expect(() => handlers.get("READY")?.()).not.toThrow();
    expect(play).not.toHaveBeenCalled();

    unmount();
    expect(control.current).toBeNull();
  });
});
