import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate, useNavigationType, type MemoryRouterProps } from "react-router-dom";
import { albumVisualStory } from "@/data/albumVisualStory";
import AlbumVisualStory from "./AlbumVisualStory";

const storyPath = "/music/albums/iets-moois/brand";
const scrollRestorationDescriptor = Object.getOwnPropertyDescriptor(window.history, "scrollRestoration");

beforeEach(() => {
  vi.spyOn(window, "scrollBy").mockImplementation(() => undefined);
  Object.defineProperty(window.history, "scrollRestoration", { configurable: true, writable: true, value: "auto" });
  vi.stubGlobal("visualViewport", { scale: 1 });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (scrollRestorationDescriptor) Object.defineProperty(window.history, "scrollRestoration", scrollRestorationDescriptor);
  else Reflect.deleteProperty(window.history, "scrollRestoration");
});

function showStory(initialEntries: MemoryRouterProps["initialEntries"] = [storyPath]) {
  let location: ReturnType<typeof useLocation>;
  let navigate: ReturnType<typeof useNavigate>;
  let navigationType: ReturnType<typeof useNavigationType>;

  function NavigationWitness() {
    location = useLocation();
    navigate = useNavigate();
    navigationType = useNavigationType();
    return <button type="button">Outside the gallery</button>;
  }

  const rendered = render(<MemoryRouter initialEntries={initialEntries}>
    <NavigationWitness />
    <Routes>
      <Route path={storyPath} element={<AlbumVisualStory />} />
      <Route path="*" element={<p>Previous page</p>} />
    </Routes>
  </MemoryRouter>);

  return {
    ...rendered,
    location: () => location,
    url: () => `${location.pathname}${location.search}${location.hash}`,
    navigationType: () => navigationType,
    go: (delta: number) => act(() => navigate(delta)),
  };
}

function openChapter(name = "De blik") {
  const opener = screen.getByRole("button", { name: new RegExp(`${name}$`) });
  opener.focus();
  fireEvent.click(opener);
  return opener;
}

const dialog = () => screen.getByRole("dialog", { name: "IETS MOOIS" });
const currentTitle = () => within(dialog()).getByRole("heading", { level: 3 }).textContent;
const currentFigure = () => within(dialog()).getByRole("figure");
const imageFor = (position: number) => within(dialog()).getByRole("img", { name: albumVisualStory[position].alt });
const closeGallery = () => fireEvent.click(within(dialog()).getByRole("button", { name: "Sluit het beeldverhaal" }));
const thumbnail = (position: number) => within(dialog()).getByRole("button", { name: `Beeld ${position + 1}: ${albumVisualStory[position].title}` });

describe("IETS MOOIS optional visual story", () => {
  it("keeps the gallery unmounted until requested, with only the hero and four entry previews on the page", () => {
    const { container } = showStory();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("group", { name: /Kies uit alle .* beelden/ })).toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(5);
    for (const image of albumVisualStory.filter((item) => item.id !== "toen-in-nu")) {
      expect(container.querySelector(`img[src="${image.src}"]`)).toBeNull();
    }
    expect(screen.getByRole("link", { name: /Lees het verhaal/ })).toHaveAttribute("href", "#album-origin");
  });

  it("opens the correct image from each of the four chapter entrances and returns focus to that entrance", async () => {
    showStory();
    const entrances = [
      ["De blik", "Een open blik"],
      ["Toen en nu", "Toen in nu"],
      ["Speelruimte", "Een beetje te veel"],
      ["De volgorde", "Volgordestudie · 01"],
    ];
    for (const [entrance, title] of entrances) {
      const opener = openChapter(entrance);
      expect(currentTitle()).toBe(title);
      expect(within(dialog()).getByRole("button", { name: "Sluit het beeldverhaal" })).toHaveFocus();
      closeGallery();
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(opener).toHaveFocus());
    }
  });

  it("keeps the app root inert for late background controls and releases it on close or unmount", async () => {
    const { container, unmount } = showStory();
    container.id = "root";
    expect(container).not.toHaveAttribute("inert");
    const opener = openChapter();
    expect(container).toHaveAttribute("inert");
    expect(dialog().closest("[inert]")).toBeNull();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    expect(currentTitle()).toBe(albumVisualStory[1].title);
    expect(container).toHaveAttribute("inert");

    // JSDOM verifies the inert boundary and lifecycle, not native focus/AX behavior.
    const lateButton = document.createElement("button");
    lateButton.textContent = "Later geladen cookievoorkeuren";
    container.appendChild(lateButton);
    expect(lateButton.closest("[inert]")).toBe(container);
    expect(dialog().closest("[inert]")).toBeNull();

    closeGallery();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
    expect(container).not.toHaveAttribute("inert");
    expect(lateButton.closest("[inert]")).toBeNull();
    openChapter("Speelruimte");
    expect(container).toHaveAttribute("inert");
    unmount();
    expect(container).not.toHaveAttribute("inert");
  });

  it("preserves an inert app root owned by another interaction after close and unmount", async () => {
    const { container, unmount } = showStory();
    container.id = "root";
    container.setAttribute("inert", "");
    // Programmatic events isolate ownership cleanup, not native inert behavior.
    const opener = screen.getByRole("button", { name: /Speelruimte$/ });
    fireEvent.click(opener);
    expect(container).toHaveAttribute("inert");
    expect(dialog().closest("[inert]")).toBeNull();
    closeGallery();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(container).toHaveAttribute("inert");
    fireEvent.click(opener);
    expect(dialog()).toBeInTheDocument();
    unmount();
    expect(container).toHaveAttribute("inert");
  });

  it("lets the reader reach all 15 unique supplied images and keeps the caption short", () => {
    showStory();
    openChapter();
    const visited = new Set<string>();
    expect(albumVisualStory).toHaveLength(15);
    for (const [position, image] of albumVisualStory.entries()) {
      expect(currentTitle()).toBe(image.title);
      expect(imageFor(position)).toHaveAttribute("src", image.src);
      expect(within(dialog()).getByText(image.caption)).toBeInTheDocument();
      const sentences = image.caption.split(/[.!?]+/).filter((sentence) => sentence.trim());
      expect(sentences.length).toBeGreaterThan(0);
      expect(sentences.length).toBeLessThanOrEqual(2);
      expect(thumbnail(position)).toHaveAttribute("aria-current", "true");
      visited.add(image.id);
      if (image.status === "Volgordestudie") expect(within(dialog()).getByText(/Voorgestelde volgorde/)).toBeInTheDocument();
      if (position < albumVisualStory.length - 1) fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    }
    expect(visited.size).toBe(15);
    expect(within(dialog()).getByRole("button", { name: "Volgend beeld" })).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    expect(currentTitle()).toBe(albumVisualStory[albumVisualStory.length - 1].title);
  });

  it("stops at both ends and supports Arrow, Home and End with focus on the selected artwork", () => {
    const navigation = showStory();
    openChapter();
    expect(within(dialog()).getByRole("button", { name: "Vorig beeld" })).toHaveAttribute("aria-disabled", "true");
    const initialUrl = navigation.url();
    fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
    expect(navigation.url()).toBe(initialUrl);
    act(() => thumbnail(0).focus());
    fireEvent.keyDown(thumbnail(0), { key: "ArrowRight" });
    expect(currentFigure()).toHaveFocus();
    expect(currentFigure()).toHaveAccessibleName("Beeld 2 van 15: Ruimte om te blijven");
    expect(thumbnail(0)).toHaveAttribute("tabindex", "-1");
    expect(thumbnail(1)).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(currentFigure(), { key: "End" });
    expect(currentFigure()).toHaveFocus();
    expect(currentTitle()).toBe(albumVisualStory[14].title);
    const finalUrl = navigation.url();
    fireEvent.keyDown(currentFigure(), { key: "ArrowRight" });
    expect(navigation.url()).toBe(finalUrl);
    fireEvent.keyDown(currentFigure(), { key: "ArrowLeft" });
    expect(currentTitle()).toBe(albumVisualStory[13].title);
    expect(currentFigure()).toHaveFocus();
    fireEvent.keyDown(currentFigure(), { key: "Home" });
    expect(currentFigure()).toHaveFocus();
    expect(thumbnail(0)).toHaveAttribute("tabindex", "0");
    expect(within(dialog()).getByRole("button", { name: "Vorig beeld" })).toHaveAttribute("aria-disabled", "true");
  });

  it.each([
    { control: "Vorig beeld", start: 1, end: 0 },
    { control: "Volgend beeld", start: 13, end: 14 },
  ])("keeps $control focusable at its boundary and ignores repeated clicks without touching history", ({ control, start, end }) => {
    const original = `${storyPath}?campaign=boundaries#album-world`;
    const navigation = showStory(["/music", original]);
    openChapter();
    fireEvent.click(thumbnail(start));
    const button = within(dialog()).getByRole("button", { name: control });
    expect(button).toHaveAttribute("aria-disabled", "false");
    act(() => button.focus());
    fireEvent.click(button);

    expect(currentTitle()).toBe(albumVisualStory[end].title);
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
    expect(button.tabIndex).toBe(0);
    expect(button).toHaveFocus();
    const boundaryLocation = navigation.location();
    const boundaryNavigationType = navigation.navigationType();
    for (let attempt = 0; attempt < 3; attempt++) {
      fireEvent.click(button);
      expect(button).toHaveFocus();
      expect(currentTitle()).toBe(albumVisualStory[end].title);
      // The same location object rules out even a replace of the same URL.
      expect(navigation.location()).toBe(boundaryLocation);
      expect(navigation.navigationType()).toBe(boundaryNavigationType);
    }

    navigation.go(-1);
    expect(navigation.url()).toBe(original);
    expect(screen.queryByRole("dialog")).toBeNull();
    navigation.go(1);
    expect(navigation.location()).toEqual(boundaryLocation);
    expect(currentTitle()).toBe(albumVisualStory[end].title);
  });

  it("returns a scrolled gallery to the artwork after rail selection while retaining focus on pinned next/previous controls", () => {
    showStory();
    openChapter();
    const scrollBody = dialog().querySelector<HTMLElement>(".avs-dialog__body")!;
    scrollBody.scrollTop = 640;
    act(() => thumbnail(8).focus());
    fireEvent.click(thumbnail(8));
    expect(currentTitle()).toBe("Vooruitkijken");
    expect(scrollBody.scrollTop).toBe(0);
    expect(currentFigure()).toHaveFocus();

    scrollBody.scrollTop = 520;
    const chapterSelect = within(dialog()).getByRole("combobox", { name: "Ontdek een ander hoofdstuk" });
    act(() => chapterSelect.focus());
    fireEvent.change(chapterSelect, { target: { value: "speelruimte" } });
    expect(currentTitle()).toBe("Een beetje te veel");
    expect(scrollBody.scrollTop).toBe(0);
    expect(currentFigure()).toHaveFocus();

    const next = within(dialog()).getByRole("button", { name: "Volgend beeld" });
    act(() => next.focus());
    scrollBody.scrollTop = 780;
    fireEvent.click(next);
    expect(currentTitle()).toBe("Een lichte tegenstem");
    expect(scrollBody.scrollTop).toBe(0);
    expect(next).toHaveFocus();

    const previous = within(dialog()).getByRole("button", { name: "Vorig beeld" });
    act(() => previous.focus());
    scrollBody.scrollTop = 700;
    fireEvent.click(previous);
    expect(currentTitle()).toBe("Een beetje te veel");
    expect(scrollBody.scrollTop).toBe(0);
    expect(previous).toHaveFocus();
    // jsdom verifies the scroll/focus state changes; visibility at a real mobile
    // viewport and sticky-control placement still require a browser check.
  });

  it("also returns to the artwork when the reader reselects its already active thumbnail", () => {
    showStory();
    openChapter();
    const scrollBody = dialog().querySelector<HTMLElement>(".avs-dialog__body")!;
    scrollBody.scrollTop = 600;
    act(() => thumbnail(0).focus());
    fireEvent.click(thumbnail(0));
    expect(currentTitle()).toBe("Een open blik");
    expect(scrollBody.scrollTop).toBe(0);
    expect(currentFigure()).toHaveFocus();
  });

  it("leaves chapter-select keys and modified browser shortcuts alone while allowing chapter and thumbnail selection", () => {
    showStory();
    openChapter();
    const select = within(dialog()).getByRole("combobox", { name: "Ontdek een ander hoofdstuk" });
    for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) fireEvent.keyDown(select, { key });
    for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"]) fireEvent.keyDown(dialog(), { key: "ArrowRight", [modifier]: true });
    expect(currentTitle()).toBe("Een open blik");
    fireEvent.change(select, { target: { value: "speelruimte" } });
    expect(currentTitle()).toBe("Een beetje te veel");
    fireEvent.click(thumbnail(8));
    expect(currentTitle()).toBe("Vooruitkijken");
    expect(select).toHaveValue("toen-nu");
  });

  it("opens a valid deep link without a click and retains unrelated query values, state and the hash when browsing", () => {
    const navigation = showStory([{
      pathname: storyPath,
      search: "?utm_source=album%20notes&filter=one&filter=two&beeld=nu-in-toen",
      hash: "#album-origin",
      state: { campaign: "test-campaign" },
    }]);
    expect(currentTitle()).toBe("Nu in toen");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    const params = new URLSearchParams(navigation.location().search);
    expect(params.get("beeld")).toBe("wat-meereist");
    expect(params.get("utm_source")).toBe("album notes");
    expect(params.getAll("filter")).toEqual(["one", "two"]);
    expect(navigation.location().hash).toBe("#album-origin");
    expect(navigation.location().state).toEqual({ campaign: "test-campaign" });
    expect(navigation.navigationType()).toBe("REPLACE");
  });

  it("ignores missing, empty and unknown image parameters without exposing an empty dialog", () => {
    for (const value of [undefined, "", "not-an-image", "../../private", "__proto__"]) {
      const suffix = value === undefined ? "?campaign=album" : `?campaign=album&beeld=${encodeURIComponent(value)}`;
      const navigation = showStory([`${storyPath}${suffix}#album-origin`]);
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(navigation.url()).toBe(`${storyPath}${suffix}#album-origin`);
      expect(screen.getByRole("button", { name: /De blik$/ })).toBeEnabled();
      cleanup();
    }
  });

  it.each([
    ["de-belofte", "iets-dichterbij"],
    ["de-beeldtaal", "de-bril-in-de-hand"],
    ["toen-en-nu", "vooruitkijken"],
    ["de-achterkant", "volgordestudie-02"],
  ])("keeps the earlier %s link on its matching image without adding a history entry", async (alias, canonicalId) => {
    const legacyUrl = `${storyPath}?campaign=legacy&beeld=${alias}#album-world`;
    const navigation = showStory(["/music", legacyUrl]);
    const position = albumVisualStory.findIndex((image) => image.id === canonicalId);
    expect(position).toBeGreaterThanOrEqual(0);
    expect(currentTitle()).toBe(albumVisualStory[position].title);
    expect(imageFor(position)).toHaveAttribute("src", albumVisualStory[position].src);
    expect(navigation.url()).toBe(legacyUrl);
    expect(navigation.navigationType()).toBe("POP");

    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    expect(new URLSearchParams(navigation.location().search).get("beeld")).toBe(albumVisualStory[position + 1].id);
    expect(new URLSearchParams(navigation.location().search).get("campaign")).toBe("legacy");
    expect(navigation.location().hash).toBe("#album-world");
    expect(navigation.navigationType()).toBe("REPLACE");
    navigation.go(-1);
    expect(navigation.url()).toBe("/music");
    navigation.go(1);
    expect(currentTitle()).toBe(albumVisualStory[position + 1].title);
    closeGallery();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(navigation.url()).toBe(`${storyPath}?campaign=legacy#album-world`);
    navigation.go(-1);
    expect(navigation.url()).toBe("/music");
  });

  it("uses one history entry for an opened gallery so Back, Forward and Close do not step through every image", async () => {
    const original = `${storyPath}?campaign=release#album-world`;
    const navigation = showStory(["/music?from=previous", original]);
    openChapter();
    expect(navigation.navigationType()).toBe("PUSH");
    for (let i = 0; i < 8; i++) fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    expect(navigation.navigationType()).toBe("REPLACE");
    const selectedUrl = navigation.url();
    navigation.go(-1);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(navigation.url()).toBe(original);
    navigation.go(1);
    expect(navigation.url()).toBe(selectedUrl);
    expect(currentTitle()).toBe("Vooruitkijken");
    closeGallery();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(navigation.url()).toBe(original);
    navigation.go(-1);
    expect(navigation.url()).toBe("/music?from=previous");
    navigation.go(1);
    expect(navigation.url()).toBe(original);
    navigation.go(1);
    expect(navigation.url()).toBe(selectedUrl);
    expect(currentTitle()).toBe("Vooruitkijken");
  });

  it("closes a direct link in place and then Back reaches the previous page", async () => {
    const navigation = showStory(["/music", `${storyPath}?campaign=direct&beeld=toen-in-nu#album-world`]);
    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    closeGallery();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(navigation.url()).toBe(`${storyPath}?campaign=direct#album-world`);
    expect(navigation.navigationType()).toBe("REPLACE");
    await waitFor(() => expect(screen.getByRole("button", { name: /Open het beeldverhaal/ })).toHaveFocus());
    navigation.go(-1);
    expect(navigation.url()).toBe("/music");
    navigation.go(1);
    expect(navigation.url()).toBe(`${storyPath}?campaign=direct#album-world`);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes with Escape, restores the exact opener and releases manual scroll restoration", async () => {
    showStory();
    const opener = openChapter("Toen en nu");
    expect(window.history.scrollRestoration).toBe("manual");
    fireEvent.keyDown(dialog(), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
    expect(window.history.scrollRestoration).toBe("auto");
  });

  it("keeps focus, caption and navigation usable when retry removes the error control and loads the image again", () => {
    const navigation = showStory();
    openChapter();
    expect(within(dialog()).getByText("Beeld laden…")).toBeInTheDocument();
    fireEvent.error(imageFor(0));
    expect(within(dialog()).getByText("Dit beeld kon niet laden.")).toBeInTheDocument();
    expect(within(dialog()).getByText(albumVisualStory[0].caption)).toBeInTheDocument();
    expect(within(dialog()).getByRole("button", { name: "Volgend beeld" })).toBeEnabled();
    const retry = within(dialog()).getByRole("button", { name: "Opnieuw proberen" });
    const locationBeforeRetry = navigation.location();
    act(() => retry.focus());
    expect(retry).toHaveFocus();
    fireEvent.click(retry);
    expect(retry).not.toBeInTheDocument();
    expect(currentFigure()).toHaveFocus();
    expect(currentFigure()).toHaveAccessibleName("Beeld 1 van 15: Een open blik");
    expect(navigation.location()).toBe(locationBeforeRetry);
    expect(imageFor(0)).toHaveAttribute("src", `${albumVisualStory[0].src}?retry=1`);
    expect(within(dialog()).getByText("Beeld laden…")).toBeInTheDocument();
    fireEvent.load(imageFor(0));
    expect(within(dialog()).queryByText("Beeld laden…")).toBeNull();
    expect(within(dialog()).queryByText("Dit beeld kon niet laden.")).toBeNull();
    expect(currentFigure()).toHaveFocus();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    expect(imageFor(1)).toHaveAttribute("src", albumVisualStory[1].src);
    expect(within(dialog()).getByText("Beeld laden…")).toBeInTheDocument();
    fireEvent.error(imageFor(1));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    expect(currentTitle()).toBe(albumVisualStory[2].title);
    expect(within(dialog()).queryByText("Dit beeld kon niet laden.")).toBeNull();
  });

  it("recognizes an already decoded cached image without leaving the loading announcement stuck", async () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(1254);
    showStory([`${storyPath}?beeld=een-open-blik`]);
    await waitFor(() => expect(within(dialog()).queryByText("Beeld laden…")).toBeNull());
    expect(imageFor(0)).toBeInTheDocument();
  });

  it("contains programmatic focus and loops Tab only at the modal boundaries", () => {
    showStory();
    const outside = screen.getByRole("button", { name: "Outside the gallery" });
    openChapter();
    const close = within(dialog()).getByRole("button", { name: "Sluit het beeldverhaal" });
    const next = within(dialog()).getByRole("button", { name: "Volgend beeld" });
    expect(close).toHaveFocus();
    act(() => outside.focus());
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(next).toHaveFocus();
    fireEvent.keyDown(next, { key: "Tab" });
    expect(close).toHaveFocus();
    // jsdom does not perform native intermediate Tab navigation; these assertions
    // cover Radix's containment/boundary handlers, not a full browser keyboard audit.
  });

  it("responds to a clear horizontal swipe but ignores vertical, short, cancelled and multitouch gestures", () => {
    showStory();
    openChapter();
    const figure = () => imageFor(albumVisualStory.findIndex((image) => image.title === currentTitle())).closest("figure")!;
    const point = (clientX: number, clientY: number) => ({ clientX, clientY });
    const swipe = (start: { clientX: number; clientY: number }, end: { clientX: number; clientY: number }) => {
      fireEvent.touchStart(figure(), { touches: [start], changedTouches: [start] });
      fireEvent.touchEnd(figure(), { touches: [], changedTouches: [end] });
    };
    swipe(point(220, 100), point(100, 110));
    expect(currentTitle()).toBe("Ruimte om te blijven");
    swipe(point(100, 100), point(110, 250));
    swipe(point(100, 100), point(140, 105));
    swipe(point(100, 100), point(180, 180));
    expect(currentTitle()).toBe("Ruimte om te blijven");
    fireEvent.touchStart(figure(), { touches: [point(100, 100), point(200, 100)], changedTouches: [point(100, 100), point(200, 100)] });
    fireEvent.touchEnd(figure(), { touches: [point(100, 100)], changedTouches: [point(300, 100)] });
    expect(currentTitle()).toBe("Ruimte om te blijven");
    fireEvent.touchStart(figure(), { touches: [point(200, 100)], changedTouches: [point(200, 100)] });
    fireEvent.touchCancel(figure());
    fireEvent.touchEnd(figure(), { changedTouches: [point(50, 100)] });
    expect(currentTitle()).toBe("Ruimte om te blijven");
    Object.assign(window.visualViewport!, { scale: 2 });
    swipe(point(220, 100), point(100, 110));
    expect(currentTitle()).toBe("Ruimte om te blijven");
    Object.assign(window.visualViewport!, { scale: 1 });
    swipe(point(100, 100), point(220, 110));
    expect(currentTitle()).toBe("Een open blik");
    swipe(point(100, 100), point(220, 110));
    expect(currentTitle()).toBe("Een open blik");
  });

  it("survives repeated open, rapid image selection and close without accumulating history entries or stale selection", async () => {
    const navigation = showStory(["/music", storyPath]);
    for (let cycle = 0; cycle < 12; cycle++) {
      const opener = openChapter(cycle % 2 === 0 ? "De blik" : "Speelruimte");
      fireEvent.click(thumbnail((cycle * 7) % albumVisualStory.length));
      fireEvent.keyDown(dialog(), { key: "End" });
      fireEvent.keyDown(dialog(), { key: "Home" });
      expect(currentTitle()).toBe("Een open blik");
      closeGallery();
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(opener).toHaveFocus());
      expect(navigation.url()).toBe(storyPath);
      expect(window.history.scrollRestoration).toBe("auto");
    }
    navigation.go(-1);
    expect(navigation.url()).toBe("/music");
  });
});
