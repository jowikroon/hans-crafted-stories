import { useEffect, useRef } from "react";
import type { Song } from "@/data/music";

export type PlaybackStatus = "loading" | "ready" | "playing" | "paused" | "error";
type Controller = { play: () => void; pause: () => void };
type SpotifyController = Controller & {
  destroy: () => void;
  addListener: (name: string, callback: (event: { data: { isPaused: boolean; isBuffering: boolean } }) => void) => void;
};
type SpotifyApi = { createController: (element: HTMLElement, options: { uri: string; width: string; height: number }, callback: (controller: SpotifyController) => void) => void };
type SoundCloudWidget = Controller & { bind: (name: string, callback: () => void) => void; unbind: (name: string) => void };
type PlayerWindow = Window & {
  onSpotifyIframeApiReady?: (api: SpotifyApi) => void;
  SC?: { Widget: ((frame: HTMLIFrameElement) => SoundCloudWidget) & { Events: Record<string, string> } };
};

let spotifyApi: Promise<SpotifyApi> | undefined;
let soundcloudApi: Promise<NonNullable<PlayerWindow["SC"]>> | undefined;

function spotify(): Promise<SpotifyApi> {
  if (!spotifyApi) spotifyApi = new Promise<SpotifyApi>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => { script.remove(); reject(new Error("Spotify timeout")); }, 12000);
    (window as PlayerWindow).onSpotifyIframeApiReady = (api) => { clearTimeout(timer); resolve(api); };
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error("Spotify unavailable")); };
    document.head.append(script);
  }).catch((error) => { spotifyApi = undefined; throw error; });
  return spotifyApi;
}

function soundcloud(): Promise<NonNullable<PlayerWindow["SC"]>> {
  const existing = (window as PlayerWindow).SC;
  if (existing) return Promise.resolve(existing);
  if (!soundcloudApi) soundcloudApi = new Promise<NonNullable<PlayerWindow["SC"]>>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => { script.remove(); reject(new Error("SoundCloud timeout")); }, 12000);
    script.src = "https://w.soundcloud.com/player/api.js";
    script.onload = () => {
      clearTimeout(timer);
      const api = (window as PlayerWindow).SC;
      if (api) resolve(api); else reject(new Error("SoundCloud unavailable"));
    };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error("SoundCloud unavailable")); };
    document.head.append(script);
  }).catch((error) => { soundcloudApi = undefined; throw error; });
  return soundcloudApi;
}

/** A single mounted widget owns audio. UI state follows provider events, never clicks. */
export default function MusicPlayer({ song, onStatus, control }: {
  song: Song;
  onStatus: (status: PlaybackStatus) => void;
  control: React.MutableRefObject<Controller | null>;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let ready = false;
    onStatus("loading");
    const report = (status: PlaybackStatus) => {
      if (!cancelled) {
        if (status !== "loading") ready = true;
        onStatus(status);
      }
    };
    const timer = window.setTimeout(() => { if (!ready) report("error"); }, 16000);
    const start = async () => {
      if (song.provider === "spotify") {
        const api = await spotify();
        if (cancelled) return;
        const target = document.createElement("div");
        container.append(target);
        const match = new URL(song.embed).pathname.match(/\/embed\/(track|album)\/([^/]+)/);
        if (!match) throw new Error("Missing Spotify recording");
        api.createController(target, { uri: `spotify:${match[1]}:${match[2]}`, width: "100%", height: 152 }, (widget) => {
          if (cancelled) { widget.destroy(); return; }
          control.current = widget;
          cleanup = () => widget.destroy();
          const frame = container.querySelector("iframe");
          if (frame) frame.title = `Spotify: ${song.title}`;
          widget.addListener("ready", () => { if (!cancelled) { report("ready"); widget.play(); } });
          widget.addListener("playback_started", () => report("playing"));
          widget.addListener("playback_update", ({ data }) => {
            if (data.isBuffering) report("loading");
            else report(data.isPaused ? "paused" : "playing");
          });
        });
      } else {
        // The native widget remains usable even if its control script is blocked.
        const frame = document.createElement("iframe");
        const url = new URL(song.embed);
        url.searchParams.set("auto_play", "true");
        url.searchParams.set("visual", "false");
        url.searchParams.set("single_active", "true");
        frame.src = url.href;
        frame.title = `SoundCloud: ${song.title}`;
        frame.allow = "autoplay";
        frame.height = "166";
        frame.width = "100%";
        container.append(frame);
        const api = await soundcloud();
        if (cancelled) return;
        const widget = api.Widget(frame);
        control.current = widget;
        const events = api.Widget.Events;
        widget.bind(events.READY, () => { if (!cancelled) { report("ready"); widget.play(); } });
        widget.bind(events.PLAY, () => report("playing"));
        widget.bind(events.PAUSE, () => report("paused"));
        widget.bind(events.FINISH, () => report("paused"));
        widget.bind(events.ERROR, () => report("error"));
        cleanup = () => {
          [events.READY, events.PLAY, events.PAUSE, events.FINISH, events.ERROR].forEach((name) => widget.unbind(name));
        };
      }
    };
    void start().catch(() => report("error"));
    return () => {
      cancelled = true;
      clearTimeout(timer);
      control.current = null;
      // React can detach the iframe before passive cleanup. Removing the frame
      // already stops its audio; never send a pause message to a detached frame.
      try { cleanup?.(); } catch { /* Provider teardown may race its frame removal. */ }
      container.replaceChildren();
    };
  }, [song, onStatus, control]);
  return <div className="mx-widget" ref={host} />;
}
