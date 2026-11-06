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
    const story = page.querySelector<HTMLElement>(".songstory")!;
    expect(story).toBeInTheDocument();
    expect(within(story).getByRole("heading", { level: 2, name: song.detail.story.emotion })).toBeInTheDocument();
    expect(within(story).getByText(song.detail.story.subline)).toBeInTheDocument();
    expect(Array.from(story.querySelectorAll(".songstory__speaker"), (node) => node.textContent)).toEqual(["I", "You", "It"]);
    expect(Array.from(story.querySelectorAll(".songstory__voice p"), (node) => node.textContent)).toEqual([
      song.detail.story.i, song.detail.story.you, song.detail.story.it,
    ]);
    expect(page.querySelector(".songstory")?.compareDocumentPosition(page.querySelector(".songbody")!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
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
    const dialogStory = modal.querySelector<HTMLElement>(".songstory")!;
    expect(dialogStory).toBeInTheDocument();
    expect(within(dialogStory).getByText(songs.find((song) => song.slug === "hanging-on")!.detail.story.subline)).toBeInTheDocument();
    expect(dialogStory.querySelector("h2")?.id).toMatch(/^dialog-.*-song-story-heading$/);
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
});
