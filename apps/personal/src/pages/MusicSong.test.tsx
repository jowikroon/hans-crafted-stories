import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import MusicSong from "./MusicSong";
import { songs } from "@/data/music";
import { songPageHead, songPageJsonLd } from "@/data/songPageSeo";
import { FONT_CSS } from "@/lib/fontCss";

const scrollCalls: { element: Element; options: ScrollIntoViewOptions }[] = [];
const observationRoots: (Element | Document | null | undefined)[] = [];
const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");

beforeEach(() => {
  scrollCalls.length = 0;
  observationRoots.length = 0;
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: function (this: Element, options: ScrollIntoViewOptions) {
      scrollCalls.push({ element: this, options });
    },
  });
  vi.stubGlobal("IntersectionObserver", class {
    constructor(_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      observationRoots.push(options?.root);
    }
    observe() { /* Layout is checked separately in the browser. */ }
    disconnect() { /* No live observer in this environment. */ }
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalScroll) Object.defineProperty(Element.prototype, "scrollIntoView", originalScroll);
  else Reflect.deleteProperty(Element.prototype, "scrollIntoView");
});

describe("Shared song studio template", () => {
  it.each(songs)("preserves the recording, sections and metadata for $title", async (song) => {
    const { container } = render(
      <MemoryRouter initialEntries={[`/music/${song.slug}`]}>
        <MusicSong songSlug={song.slug} />
      </MemoryRouter>,
    );
    const page = container.querySelector<HTMLElement>(".music-v2.song-studio-page")!;
    expect(page).toBeInTheDocument();
    expect(within(page).getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(page).getByRole("heading", { level: 1, name: song.title })).toBeInTheDocument();
    const playerTitle = `${song.provider === "soundcloud" ? "SoundCloud" : "Spotify"}: ${song.title}`;
    expect(within(page).getByTitle(playerTitle)).toHaveAttribute("src", song.embed);
    const processControl = within(page).getByRole("button", { name: "Inside the recording" });
    expect(processControl).toHaveAttribute("aria-controls", "song-process");
    const processAnchor = page.querySelector<HTMLElement>("#song-process")!;
    expect(processAnchor).toBeInTheDocument();
    await within(processAnchor).findByRole("heading", { level: 2 });
    expect(page.querySelector("#song-process")).toBe(processAnchor);
    for (const button of within(page).getAllByRole("button").filter((node) => node.hasAttribute("aria-controls"))) {
      expect(page.querySelector(`[id="${button.getAttribute("aria-controls")}"]`)).toBeInTheDocument();
    }
    expect(page.textContent).not.toMatch(/\b(?:suno|ai)\b/i);

    const head = songPageHead(song);
    expect(document.title).toBe(head.title);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute("href", head.canonical);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute("content", head.description);
    expect(document.querySelector('meta[property="og:type"]')).toHaveAttribute("content", "music.song");
    const schema = JSON.parse(document.getElementById("page-jsonld")!.textContent!);
    expect(schema).toEqual(songPageJsonLd(song));
    expect(JSON.stringify(schema)).not.toMatch(/\b(?:suno|ai)\b/i);
    expect(schema["@graph"].find((node: Record<string, unknown>) => node["@type"] === "MusicRecording").datePublished).toBe(song.date);
    expect(document.getElementById("fonts-neon")).toHaveAttribute("href", FONT_CSS.writing);
  });

  it("keeps a same-song dialog's IDs, scrolling, player and metadata separate from the background", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/music/hanging-on"]}>
        <MusicSong songSlug="hanging-on" />
        <div className="mx-song-modal">
          <div className="mx-modal-scroll">
            <MusicSong songSlug="hanging-on" inDialog player={<div data-testid="dialog-player">Listen to Hanging On</div>} />
          </div>
        </div>
      </MemoryRouter>,
    );
    const modal = container.querySelector<HTMLElement>(".mx-song-modal")!;
    const controls = screen.getAllByRole("button", { name: "Inside the recording" });
    const targets = controls.map((button) => document.getElementById(button.getAttribute("aria-controls")!));
    expect(controls).toHaveLength(2);
    expect(targets.every(Boolean)).toBe(true);
    expect(targets[0]).not.toBe(targets[1]);
    expect(modal.contains(targets[1])).toBe(true);
    await within(targets[1] as HTMLElement).findByRole("heading", { level: 2 });
    const ids = Array.from(container.querySelectorAll("[id]"), (element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(within(modal).queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(within(modal).getByRole("heading", { level: 2, name: "Hanging On" })).toBeInTheDocument();
    expect(within(modal).getByTestId("dialog-player")).toBeInTheDocument();
    expect(modal.querySelector("iframe")).toBeNull();
    expect(observationRoots).toContain(container.querySelector(".mx-modal-scroll"));

    fireEvent.click(controls[1]);
    expect(scrollCalls).toEqual([{ element: targets[1], options: { behavior: "smooth", block: "start" } }]);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute("href", "https://hansvanleeuwen.com/music/hanging-on");
    expect(document.querySelectorAll("#page-jsonld")).toHaveLength(1);
  });

  it("uses immediate section scrolling for reduced motion", () => {
    const original = window.matchMedia("(prefers-reduced-motion: reduce)");
    vi.spyOn(window, "matchMedia").mockReturnValue({ ...original, matches: true });
    render(<MemoryRouter><MusicSong songSlug="that-spark" /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Inside the recording" }));
    expect(scrollCalls).toHaveLength(1);
    expect(scrollCalls[0].options.behavior).toBe("auto");
    expect(scrollCalls[0].element.id).toBe("song-process");
  });

  it("keeps an unknown recording unindexed without showing another song's process", () => {
    render(<MemoryRouter><MusicSong songSlug="unknown-recording" /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1, name: "Track not found" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inside the recording" })).not.toBeInTheDocument();
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it.each([
    { slug: "beat-drop", cover: "/images/music/beat-drop-cover.jpg", storyTitle: "Before the city moves", meta: "city moving as one", sibling: "Neon House of Glass" },
    { slug: "neon-house-of-glass", cover: "/images/music/neon-house-of-glass-cover.jpg", storyTitle: "The distance behind the glow", meta: "thousand hearts", sibling: "Beat Drop" },
  ])("gives the official NEON song $slug its artwork, narrative and album association", ({ slug, cover, storyTitle, meta, sibling }) => {
    const song = songs.find((entry) => entry.slug === slug)!;
    const { container } = render(<MemoryRouter><MusicSong songSlug={slug} /></MemoryRouter>);
    const hero = container.querySelector<HTMLImageElement>(".songhead__art img")!;
    expect(hero).toHaveAttribute("src", cover);
    expect(hero).toHaveAttribute("alt", song.coverAlt);
    expect(hero).toHaveAttribute("width", "640");
    expect(hero).toHaveAttribute("height", "640");
    expect(container.querySelector(".cover-fallback")).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute("content", `https://hansvanleeuwen.com${cover}`);
    expect(document.querySelector('meta[name="twitter:image"]')).toHaveAttribute("content", `https://hansvanleeuwen.com${cover}`);
    expect(document.querySelector('meta[property="og:image:alt"]')).toHaveAttribute("content", song.coverAlt);
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toContain(meta);
    expect(screen.getByRole("heading", { name: storyTitle })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "NEON" })).toHaveAttribute("href", "/music/albums/neon-the-signal-between");
    expect(screen.getByRole("heading", { name: "Continue through NEON" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(sibling) })).toHaveAttribute("href", `/music/${sibling === "Beat Drop" ? "beat-drop" : "neon-house-of-glass"}`);
    const recording = songPageJsonLd(song)["@graph"].find((node) => node["@type"] === "MusicRecording")!;
    expect(recording).toHaveProperty("inAlbum.@id", "https://hansvanleeuwen.com/music/albums/neon-the-signal-between#album");
    expect(recording).toHaveProperty("sameAs", song.links?.spotify);
  });

  it("keeps a failed cover readable without exposing a duplicate screenreader title", () => {
    const { container } = render(<MemoryRouter><MusicSong songSlug="beat-drop" /></MemoryRouter>);
    expect(screen.queryByRole("img", { name: /could not be loaded/i })).not.toBeInTheDocument();
    fireEvent.error(container.querySelector(".songhead__art img")!);
    expect(container.querySelector(".songhead__art img")).toBeNull();
    expect(screen.getByRole("img", { name: "Artwork for Beat Drop could not be loaded" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Beat Drop", level: 1 })).toBeInTheDocument();
  });

  it("keeps NEON-adjacent public concepts distinct from unannounced album slots", () => {
    for (const slug of ["hanging-on", "that-spark"]) {
      const song = songs.find((entry) => entry.slug === slug)!;
      const head = songPageHead(song);
      expect(head.description).not.toContain("Private");
      expect(head.ogImageAlt).toBe(song.coverAlt);
      const recording = songPageJsonLd(song)["@graph"].find((node) => node["@type"] === "MusicRecording")!;
      expect(recording).not.toHaveProperty("inAlbum");
      expect(song.detail.storyTriptych?.i).toBeTruthy();
    }
    expect(songs.some((song) => song.slug === "pressure" || song.slug === "new-level")).toBe(false);
  });
});
