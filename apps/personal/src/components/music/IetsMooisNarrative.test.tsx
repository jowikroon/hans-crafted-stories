import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes, useLocation, useNavigate, useNavigationType, type MemoryRouterProps } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import { getAlbum } from "@/data/albums";
import AlbumPageTemplate from "./AlbumPageTemplate";
import AlbumVisualStory from "./AlbumVisualStory";
import IetsMooisNarrative from "./IetsMooisNarrative";

const storyPath = "/music/albums/iets-moois/brand";
const sceneIds = ["album-origin", "album-toen", "album-tegenstem", "album-stilte", "album-tempo", "album-spiegeling", "album-vandaag", "album-code"];
const sceneImages = [
  ["Iets dichterbij", "iets-dichterbij"],
  ["Vooruitkijken", "vooruitkijken"],
  ["Een beetje te veel", "een-beetje-te-veel"],
  ["Een beetje licht", "een-beetje-licht"],
  ["Toen in nu", "toen-in-nu"],
  ["Nu in toen", "nu-in-toen"],
  ["Ruimte om te blijven", "ruimte-om-te-blijven"],
] as const;
const scrollRestorationDescriptor = Object.getOwnPropertyDescriptor(window.history, "scrollRestoration");
const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");

beforeEach(() => {
  vi.spyOn(window, "scrollBy").mockImplementation(() => undefined);
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  Object.defineProperty(window.history, "scrollRestoration", { configurable: true, writable: true, value: "auto" });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (scrollRestorationDescriptor) Object.defineProperty(window.history, "scrollRestoration", scrollRestorationDescriptor);
  else Reflect.deleteProperty(window.history, "scrollRestoration");
  if (scrollIntoViewDescriptor) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollIntoViewDescriptor);
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});

function StoryComposition() {
  return <AlbumPageTemplate album={getAlbum("iets-moois")!} section="brand">
    <AlbumVisualStory>{(openArtwork) => <IetsMooisNarrative onOpenArtwork={openArtwork} />}</AlbumVisualStory>
  </AlbumPageTemplate>;
}

function showStory(initialEntries: MemoryRouterProps["initialEntries"] = [storyPath]) {
  let location: ReturnType<typeof useLocation>;
  let navigate: ReturnType<typeof useNavigate>;
  let navigationType: ReturnType<typeof useNavigationType>;

  function NavigationWitness() {
    location = useLocation();
    navigate = useNavigate();
    navigationType = useNavigationType();
    return null;
  }

  const container = document.createElement("div");
  container.id = "root";
  document.body.appendChild(container);
  const rendered = render(<MemoryRouter initialEntries={initialEntries}>
    <NavigationWitness />
    <Routes>
      <Route path={storyPath} element={<StoryComposition />} />
      <Route path="*" element={<p>Previous page</p>} />
    </Routes>
  </MemoryRouter>, { container });

  return {
    ...rendered,
    location: () => location,
    url: () => `${location.pathname}${location.search}${location.hash}`,
    navigationType: () => navigationType,
    go: (delta: number) => act(() => navigate(delta)),
  };
}

const dialog = () => screen.getByRole("dialog", { name: "IETS MOOIS" });
const openerFor = (title: string) => screen.getByRole("button", { name: `Bekijk beeld en ontwerp: ${title}` });
const closeGallery = () => fireEvent.click(within(dialog()).getByRole("button", { name: "Sluit het beeldverhaal" }));

describe("IETS MOOIS continuous narrative and gallery integration", () => {
  it("server-renders the eight story chapters, the exact last words and the symbolic NEON reveal without hiding content", () => {
    const html = renderToString(<StaticRouter location={storyPath}><IetsMooisNarrative onOpenArtwork={vi.fn()} /></StaticRouter>);
    const staticRoot = document.createElement("div");
    staticRoot.innerHTML = html;
    const narrative = staticRoot.querySelector(".im-narrative")!;
    const chapters = within(narrative as HTMLElement).getByRole("navigation", { name: "Hoofdstukken van het verhaal" });
    const links = within(chapters).getAllByRole("link");

    expect(links.map((link) => link.getAttribute("href"))).toEqual(sceneIds.map((id) => `#${id}`));
    expect(staticRoot.querySelectorAll("h1")).toHaveLength(1);
    expect(staticRoot.querySelector("#album-spoor")).not.toBeNull();
    expect(staticRoot.querySelector('[role="dialog"]')).toBeNull();
    expect(narrative.querySelector('[hidden], [role="tab"], [role="tabpanel"]')).toBeNull();
    expect(narrative.textContent).toContain("Maak er iets moois van.");
    expect(narrative.textContent).toContain("Zijn laatste woorden");
    expect(narrative.textContent).toContain("gevoelens die daar allang zaten");
    expect(narrative.textContent).toContain("Niet verbergen. Niet alles tegelijk.");
    expect(narrative.textContent).toContain("3 = ON");
    expect(narrative.textContent).toContain("geen definitieve volgorde van de nummers");
    expect(narrative.textContent).toContain("En ik ben");
    expect(narrative.textContent).not.toContain("Ik beloofde iets moois te maken");

    for (const id of sceneIds) {
      const scene = narrative.querySelector(`#${id}`)!;
      expect(scene).not.toBeNull();
      expect(scene).toHaveAttribute("tabindex", "-1");
      const title = staticRoot.querySelector(`#${scene.getAttribute("aria-labelledby")}`);
      expect(title?.textContent?.trim()).toBeTruthy();
      expect(scene.closest('[hidden], [aria-hidden="true"]')).toBeNull();
    }

    expect(narrative.querySelectorAll(".im-cipher__card")).toHaveLength(3);
    expect(narrative.querySelectorAll(".im-door-art span")).toHaveLength(7);
    expect(narrative.querySelectorAll(".im-album-bridge__albums a")).toHaveLength(2);

    const images = Array.from(narrative.querySelectorAll(".im-artwork img"));
    expect(images).toHaveLength(7);
    expect(images.map((image) => image.getAttribute("src"))).toEqual(sceneImages.map(([, id]) => `/images/music/iets-moois-story/${id}.webp`));
    expect(images.filter((image) => image.getAttribute("loading") === "eager")).toHaveLength(1);
    for (const image of images) {
      expect(image).toHaveAttribute("width", "1254");
      expect(image).toHaveAttribute("height", "1254");
      expect(image.alt.trim()).toBeTruthy();
    }
    expect(narrative.querySelectorAll(".im-album-bridge__albums img")).toHaveLength(2);
  });

  it("opens the matching artwork from every scene and returns to that exact scene button", async () => {
    const navigation = showStory();
    const narrative = navigation.container.querySelector(".im-narrative")!;
    const gallery = navigation.container.querySelector("#album-world")!;
    expect(narrative.closest("#album-world")).toBeNull();
    expect(narrative.compareDocumentPosition(gallery) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const [title, id] of sceneImages) {
      const opener = openerFor(title);
      opener.focus();
      fireEvent.click(opener);
      expect(new URLSearchParams(navigation.location().search).get("beeld")).toBe(id);
      expect(within(dialog()).getByRole("heading", { level: 3 })).toHaveTextContent(title);
      expect(within(dialog()).getByRole("button", { name: "Sluit het beeldverhaal" })).toHaveFocus();
      expect(navigation.container).toHaveAttribute("inert");
      closeGallery();
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(opener).toHaveFocus());
      expect(navigation.container).not.toHaveAttribute("inert");
      expect(navigation.url()).toBe(storyPath);
    }
  });

  it("restores the original scene and compensates its measured position after browsing then Escape", async () => {
    const originalUrl = `${storyPath}?campaign=story#album-stilte`;
    const navigation = showStory(["/music", originalUrl]);
    const opener = openerFor("Een beetje licht");
    const scene = document.getElementById("album-stilte");
    const rect = opener.getBoundingClientRect();
    let top = 120;
    vi.spyOn(opener, "getBoundingClientRect").mockImplementation(() => ({ ...rect, top, bottom: top + 300 }));
    vi.mocked(window.scrollTo).mockClear();

    opener.focus();
    fireEvent.click(opener);
    expect(navigation.navigationType()).toBe("PUSH");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    expect(navigation.navigationType()).toBe("REPLACE");
    expect(navigation.location().hash).toBe("#album-stilte");
    expect(new URLSearchParams(navigation.location().search).get("campaign")).toBe("story");
    expect(document.getElementById("album-stilte")).toBe(scene);
    expect(window.scrollTo).not.toHaveBeenCalled();

    // jsdom has no layout. The explicit change models a position shift, not a
    // native browser scroll measurement; production positions are checked in UI.
    top = 355;
    fireEvent.keyDown(dialog(), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
    expect(window.scrollBy).toHaveBeenLastCalledWith({ top: 235, behavior: "instant" });
    expect(navigation.url()).toBe(originalUrl);
    expect(window.history.scrollRestoration).toBe("auto");
    expect(document.getElementById("album-stilte")).toBe(scene);
  });

  it("keeps one history entry and the scene opener across Back, Forward and closing", async () => {
    const originalUrl = `${storyPath}#album-tegenstem`;
    const navigation = showStory(["/music", originalUrl]);
    const opener = openerFor("Een beetje te veel");
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    const selectedUrl = navigation.url();
    expect(within(dialog()).getByRole("heading", { level: 3 })).toHaveTextContent("Een lichte tegenstem");

    navigation.go(-1);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
    expect(navigation.url()).toBe(originalUrl);
    navigation.go(1);
    expect(navigation.url()).toBe(selectedUrl);
    expect(within(dialog()).getByRole("heading", { level: 3 })).toHaveTextContent("Een lichte tegenstem");
    closeGallery();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
    expect(navigation.url()).toBe(originalUrl);
    navigation.go(-1);
    expect(navigation.url()).toBe("/music");
  });

  it("closes a direct legacy image link in place while leaving the complete narrative available", async () => {
    const navigation = showStory(["/music", `${storyPath}?campaign=direct&beeld=de-belofte#album-world`]);
    expect(within(dialog()).getByRole("heading", { level: 3 })).toHaveTextContent("Iets dichterbij");
    expect(navigation.container).toHaveAttribute("inert");
    closeGallery();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(navigation.navigationType()).toBe("REPLACE");
    expect(navigation.url()).toBe(`${storyPath}?campaign=direct#album-world`);
    await waitFor(() => expect(screen.getByRole("button", { name: /Open het beeldverhaal/ })).toHaveFocus());
    expect(navigation.container).not.toHaveAttribute("inert");
    for (const id of sceneIds) expect(document.getElementById(id)).toBeVisible();
    expect(screen.getAllByRole("button", { name: /^Bekijk beeld en ontwerp:/ })).toHaveLength(7);
    navigation.go(-1);
    expect(navigation.url()).toBe("/music");
  });
});
