import { afterEach, describe, expect, it } from "vitest";
import { useEffect } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import AlbumVisualStory from "./AlbumVisualStory";
import { ietsMooisVisualStory as images } from "@/data/albumVisualStory";

afterEach(cleanup);

function HistoryProbe({ expose }: { expose: (navigate: NavigateFunction) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { expose(navigate); }, [expose, navigate]);
  return <output data-testid="gallery-location">{location.pathname}{location.search}{location.hash}</output>;
}

function showGallery(initialEntries = ["/music/albums/iets-moois/brand"]) {
  let navigation: NavigateFunction;
  const expose = (navigate: NavigateFunction) => { navigation = navigate; };
  const rendered = render(<MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
    <HistoryProbe expose={expose} />
    <button type="button">Buiten het beeldverhaal</button>
    <AlbumVisualStory />
  </MemoryRouter>);
  return { ...rendered, go: (delta: number) => { act(() => navigation(delta)); } };
}

function openImage(index = 0) {
  const trigger = screen.getByRole("button", { name: `Bekijk ${images[index].title.toLowerCase()}` });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

function dialog() {
  return screen.getByRole("dialog", { name: "IETS MOOIS in beeld" });
}

function expectSelection(index: number) {
  const item = images[index];
  const view = within(dialog());
  expect(view.getByRole("heading", { level: 3, name: item.title })).toBeInTheDocument();
  expect(view.getByRole("img", { name: item.alt })).toHaveAttribute("src", `/images/albums/iets-moois-story/${item.id}.webp`);
  expect(dialog()).toHaveAccessibleDescription(item.description);
  const choices = within(view.getByRole("group", { name: "Kies een beeld" })).getAllByRole("button");
  expect(choices.filter((button) => button.getAttribute("aria-pressed") === "true")).toHaveLength(1);
  expect(choices[index]).toHaveAttribute("aria-pressed", "true");
  const position = view.getAllByRole("status").find((status) => status.textContent?.includes(item.title));
  expect(position).toHaveTextContent(`Beeld ${index + 1} / van ${images.length}`);
}

async function closeWithButton(trigger: HTMLElement) {
  fireEvent.click(within(dialog()).getByRole("button", { name: "Sluiten" }));
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
}

describe("IETS MOOIS visual story", () => {
  it("starts with four named image buttons and no open overlay", () => {
    showGallery();
    const entries = screen.getAllByRole("button", { name: /^Bekijk / });
    expect(entries).toHaveLength(4);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    for (const entry of entries) expect(entry).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.getByRole("heading", { name: /Vier beelden.*Eén verhaal/ })).toBeInTheDocument();
  });

  it.each(images.map((item, index) => ({ ...item, index })))("opens $title directly with its matching artwork and short explanation", async ({ index }) => {
    showGallery();
    const trigger = openImage(index);
    expectSelection(index);
    expect(dialog()).toHaveAttribute("lang", "nl");
    await waitFor(() => expect(within(dialog()).getByRole("button", { name: "Sluiten" })).toHaveFocus());
    await closeWithButton(trigger);
  });

  it("keeps every explanation to at most two sentences and labels the back-cover order as a proposal", () => {
    showGallery();
    openImage();
    images.forEach((item, index) => {
      fireEvent.click(within(dialog()).getByRole("button", { name: `Toon ${item.title.toLowerCase()}` }));
      const copy = within(dialog()).getByText(item.description).textContent!.trim();
      const sentences = copy.split(/[.!?](?:\s+|$)/u).filter((sentence) => sentence.trim());
      expect(sentences.length).toBeGreaterThan(0);
      expect(sentences.length).toBeLessThanOrEqual(2);
      expectSelection(index);
    });
    expect(within(dialog()).getByText(images[3].description)).toHaveTextContent(/voorstel/i);
    expect(dialog().textContent).not.toMatch(/definitieve tracklist|suno|neural.?analog|\bAI\b|LUFS|dBTP/i);
  });

  it("keeps the background out of the accessible view while the modal is open, then restores it", async () => {
    showGallery();
    const outside = screen.getByRole("button", { name: "Buiten het beeldverhaal" });
    const trigger = openImage(1);
    expect(dialog()).toHaveAttribute("aria-modal", "true");
    expect(screen.queryByRole("button", { name: "Buiten het beeldverhaal" })).not.toBeInTheDocument();
    expect(outside.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole("button", { name: /^Bekijk / })).not.toBeInTheDocument();
    await closeWithButton(trigger);
    expect(screen.getByRole("button", { name: "Buiten het beeldverhaal" })).toBe(outside);
    expect(outside.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("closes with browser Back after image navigation and restores the same image with Forward", async () => {
    const history = showGallery(["/music", "/music/albums/iets-moois/brand"]);
    const trigger = openImage(0);
    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    expectSelection(2);
    history.go(-1);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
    expect(screen.getByTestId("gallery-location")).toHaveTextContent(/^\/music\/albums\/iets-moois\/brand$/);
    history.go(1);
    expectSelection(2);
    await closeWithButton(trigger);
  });

  it("does not add a history entry for every next image or thumbnail selection", async () => {
    const history = showGallery(["/music", "/music/albums/iets-moois/brand"]);
    const trigger = openImage();
    for (let step = 0; step < 12; step++) {
      fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    }
    fireEvent.click(within(dialog()).getByRole("button", { name: "Toon toen & nu" }));
    await closeWithButton(trigger);
    history.go(-1);
    expect(screen.getByTestId("gallery-location")).toHaveTextContent(/^\/music$/);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a directly linked image and closes it safely on the album page with useful focus", async () => {
    const history = showGallery(["/music", "/music/albums/iets-moois/brand?beeld=toen-en-nu"]);
    expectSelection(2);
    await waitFor(() => expect(within(dialog()).getByRole("button", { name: "Sluiten" })).toHaveFocus());
    fireEvent.click(within(dialog()).getByRole("button", { name: "Sluiten" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Bekijk toen & nu" })).toHaveFocus();
    });
    expect(screen.getByTestId("gallery-location")).toHaveTextContent(/^\/music\/albums\/iets-moois\/brand$/);
    history.go(-1);
    expect(screen.getByTestId("gallery-location")).toHaveTextContent(/^\/music$/);
  });

  it("preserves the page query and reading anchor when opening, moving and closing", async () => {
    const initial = "/music/albums/iets-moois/brand?bron=album&campagne=herfst#album-world";
    showGallery([initial]);
    const trigger = openImage(1);
    let url = new URL(screen.getByTestId("gallery-location").textContent!, "https://hansvanleeuwen.com");
    expect(url.searchParams.get("bron")).toBe("album");
    expect(url.searchParams.get("campagne")).toBe("herfst");
    expect(url.searchParams.get("beeld")).toBe("de-beeldtaal");
    expect(url.hash).toBe("#album-world");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    url = new URL(screen.getByTestId("gallery-location").textContent!, "https://hansvanleeuwen.com");
    expect(url.searchParams.get("beeld")).toBe("toen-en-nu");
    expect(url.searchParams.get("bron")).toBe("album");
    expect(url.searchParams.get("campagne")).toBe("herfst");
    expect(url.hash).toBe("#album-world");
    await closeWithButton(trigger);
    expect(screen.getByTestId("gallery-location").textContent).toBe(initial);
  });

  it("removes only the image parameter when closing a direct URL", async () => {
    showGallery(["/music/albums/iets-moois/brand?bron=album&beeld=de-achterkant#album-world"]);
    expectSelection(3);
    fireEvent.click(within(dialog()).getByRole("button", { name: "Sluiten" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByTestId("gallery-location")).toHaveTextContent(/^\/music\/albums\/iets-moois\/brand\?bron=album#album-world$/);
  });

  it("ignores an unknown image URL and still allows a valid image to open", () => {
    showGallery(["/music/albums/iets-moois/brand?beeld=onbekend"]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    openImage(1);
    expectSelection(1);
  });

  it("closes with Escape and returns focus to the exact image that opened it", async () => {
    showGallery();
    const trigger = openImage(2);
    await waitFor(() => expect(within(dialog()).getByRole("button", { name: "Sluiten" })).toHaveFocus());
    fireEvent.keyDown(document.activeElement!, { key: "Escape", code: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("handles repeated close actions without navigating beyond the album page", async () => {
    const history = showGallery(["/music", "/music/albums/iets-moois/brand"]);
    const trigger = openImage(2);
    const close = within(dialog()).getByRole("button", { name: "Sluiten" });
    act(() => {
      close.click();
      close.click();
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
    expect(screen.getByTestId("gallery-location")).toHaveTextContent(/^\/music\/albums\/iets-moois\/brand$/);
    history.go(-1);
    expect(screen.getByTestId("gallery-location")).toHaveTextContent(/^\/music$/);
  });

  it("keeps focus inside the open modal if background content tries to take it", async () => {
    showGallery();
    const outside = screen.getByRole("button", { name: "Buiten het beeldverhaal" });
    openImage();
    await waitFor(() => expect(within(dialog()).getByRole("button", { name: "Sluiten" })).toHaveFocus());
    outside.focus();
    await waitFor(() => expect(dialog().contains(document.activeElement)).toBe(true));
  });

  it("supports the full keyboard reading loop with arrows, Home and End", () => {
    showGallery();
    openImage();
    const view = dialog();
    fireEvent.keyDown(view, { key: "ArrowRight" });
    expectSelection(1);
    fireEvent.keyDown(view, { key: "End" });
    expectSelection(3);
    fireEvent.keyDown(view, { key: "ArrowRight" });
    expectSelection(0);
    fireEvent.keyDown(view, { key: "ArrowLeft" });
    expectSelection(3);
    fireEvent.keyDown(view, { key: "Home" });
    expectSelection(0);
  });

  it("leaves modified keyboard shortcuts and unrelated keys alone", () => {
    showGallery();
    openImage(1);
    for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"]) {
      fireEvent.keyDown(dialog(), { key: "ArrowRight", [modifier]: true });
      expectSelection(1);
    }
    for (const key of ["ArrowUp", "ArrowDown", "Tab", "a"]) {
      fireEvent.keyDown(dialog(), { key });
      expectSelection(1);
    }
  });

  it("lets visitors select any thumbnail and keeps focus on the visible next-image control", () => {
    showGallery();
    openImage();
    const next = within(dialog()).getByRole("button", { name: "Volgend beeld" });
    for (const index of [3, 1, 2, 0]) {
      const choice = within(dialog()).getByRole("button", { name: `Toon ${images[index].title.toLowerCase()}` });
      choice.focus();
      fireEvent.click(choice);
      expectSelection(index);
      expect(next).toHaveFocus();
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
    }
  });

  it("returns a scrolled viewer to the artwork whenever a different image is selected", () => {
    showGallery();
    openImage();
    // JSDOM cannot measure a mobile viewport; exercise the observed scroll state directly.
    const body = dialog().querySelector<HTMLDivElement>(".ma-art-dialog__body")!;
    const next = within(dialog()).getByRole("button", { name: "Volgend beeld" });
    body.scrollTop = 420;
    fireEvent.click(next);
    expectSelection(1);
    expect(body.scrollTop).toBe(0);
    body.scrollTop = 680;
    fireEvent.click(within(dialog()).getByRole("button", { name: "Toon de achterkant" }));
    expectSelection(3);
    expect(body.scrollTop).toBe(0);
    expect(next).toHaveFocus();
    body.scrollTop = 350;
    fireEvent.keyDown(next, { key: "Home" });
    expectSelection(0);
    expect(body.scrollTop).toBe(0);
  });

  it("moves keyboard focus from the scrolling thumbnails to stable navigation after selection", () => {
    showGallery();
    openImage();
    const body = dialog().querySelector<HTMLDivElement>(".ma-art-dialog__body")!;
    const choice = within(dialog()).getByRole("button", { name: "Toon de belofte" });
    choice.focus();
    body.scrollTop = 500;
    fireEvent.keyDown(choice, { key: "ArrowRight" });
    expectSelection(1);
    expect(body.scrollTop).toBe(0);
    expect(within(dialog()).getByRole("button", { name: "Volgend beeld" })).toHaveFocus();
  });

  it("wraps the previous and next controls at both ends without changing focus", () => {
    showGallery();
    openImage();
    const previous = within(dialog()).getByRole("button", { name: "Vorig beeld" });
    const next = within(dialog()).getByRole("button", { name: "Volgend beeld" });
    previous.focus();
    fireEvent.click(previous);
    expectSelection(3);
    expect(previous).toHaveFocus();
    next.focus();
    fireEvent.click(next);
    expectSelection(0);
    expect(next).toHaveFocus();
  });

  it("keeps navigation and closing available after an image fails and supports retry", async () => {
    showGallery();
    const trigger = openImage();
    fireEvent.error(within(dialog()).getByRole("img", { name: images[0].alt }));
    expect(within(dialog()).getByText("Dit beeld kon niet laden.")).toBeInTheDocument();
    expect(within(dialog()).getByRole("button", { name: "Probeer opnieuw" })).toBeEnabled();
    expect(within(dialog()).getByRole("button", { name: "Sluiten" })).toBeEnabled();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    expectSelection(1);
    expect(within(dialog()).queryByText("Dit beeld kon niet laden.")).not.toBeInTheDocument();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Vorig beeld" }));
    expect(within(dialog()).getByText("Dit beeld kon niet laden.")).toBeInTheDocument();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Probeer opnieuw" }));
    expectSelection(0);
    expect(within(dialog()).queryByText("Dit beeld kon niet laden.")).not.toBeInTheDocument();
    fireEvent.load(within(dialog()).getByRole("img", { name: images[0].alt }));
    await closeWithButton(trigger);
  });

  it("recovers each failed artwork independently without trapping the visitor", () => {
    showGallery();
    openImage();
    for (let index = 0; index < images.length; index++) {
      fireEvent.error(within(dialog()).getByRole("img", { name: images[index].alt }));
      expect(within(dialog()).getByRole("button", { name: "Probeer opnieuw" })).toBeEnabled();
      fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    }
    for (let index = 0; index < images.length; index++) {
      fireEvent.click(within(dialog()).getByRole("button", { name: "Probeer opnieuw" }));
      expectSelection(index);
      fireEvent.click(within(dialog()).getByRole("button", { name: "Volgend beeld" }));
    }
    expectSelection(0);
  });

  it("survives thirty open/close cycles with one modal and the correct focus return", async () => {
    showGallery();
    for (let cycle = 0; cycle < 30; cycle++) {
      const index = cycle % images.length;
      const trigger = openImage(index);
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expectSelection(index);
      if (cycle % 2 === 0) await closeWithButton(trigger);
      else {
        fireEvent.keyDown(dialog(), { key: "Escape", code: "Escape" });
        await waitFor(() => {
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
          expect(trigger).toHaveFocus();
        });
      }
      expect(screen.getAllByRole("button", { name: /^Bekijk / })).toHaveLength(4);
    }
  });

  it("keeps artwork, selection and position synchronized through one hundred quick navigation clicks", () => {
    showGallery();
    openImage();
    let position = 0;
    const next = within(dialog()).getByRole("button", { name: "Volgend beeld" });
    const previous = within(dialog()).getByRole("button", { name: "Vorig beeld" });
    for (let click = 0; click < 100; click++) {
      const direction = click % 5 === 0 ? -1 : 1;
      fireEvent.click(direction === 1 ? next : previous);
      position = (position + direction + images.length) % images.length;
      expectSelection(position);
    }
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("cleans up the modal and background restrictions when the story unmounts", async () => {
    const { unmount } = showGallery();
    openImage();
    expect(dialog()).toBeInTheDocument();
    unmount();
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument();
      expect(document.body.style.pointerEvents).not.toBe("none");
    });
    const { unmount: unmountAgain } = showGallery();
    const trigger = openImage(3);
    expectSelection(3);
    await closeWithButton(trigger);
    unmountAgain();
  });
});
