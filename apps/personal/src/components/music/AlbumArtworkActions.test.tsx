import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { albumVisualStory } from "@/data/albumVisualStory";
import AlbumArtworkActions from "./AlbumArtworkActions";

const firstImage = albumVisualStory[5];
const secondImage = albumVisualStory[14];
const originalUrl = window.location.href;
const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  else Reflect.deleteProperty(navigator, "clipboard");
  window.history.replaceState(null, "", originalUrl);
});

function installClipboard(writeText?: (text: string) => Promise<void>, available = true) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: available ? { writeText } : undefined,
  });
}

function deferredCopy() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = () => resolvePromise();
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function settle(copy: ReturnType<typeof deferredCopy>, outcome: "resolve" | "reject" = "resolve") {
  await act(async () => {
    if (outcome === "resolve") copy.resolve();
    else copy.reject(new Error("Clipboard permission denied"));
    await Promise.resolve();
  });
}

const imageUrl = (image = firstImage) => `https://hansvanleeuwen.com/music/albums/iets-moois/brand?beeld=${encodeURIComponent(image.id)}#album-world`;
const copyButton = () => screen.getByRole("button", { name: "Kopieer beeldlink" });
const status = () => screen.getByRole("status");
const otherControl = () => screen.getByRole("button", { name: "Verder op de pagina" });
const manualField = () => screen.getByRole("textbox", { name: "Beeldlink" }) as HTMLInputElement;

// The gallery deliberately keys the actions by image id. Keep that lifecycle
// here, including a persistent control outside the actions for focus checks.
function actions(image = firstImage, visible = true) {
  return <div>
    <button type="button">Verder op de pagina</button>
    {visible && <AlbumArtworkActions key={image.id} image={image} />}
  </div>;
}

function clickCopy() {
  copyButton().focus();
  fireEvent.click(copyButton());
}

describe("IETS MOOIS artwork actions", () => {
  it("offers the existing full-size image as a native link with a named new-tab destination", () => {
    render(actions());
    const link = screen.getByRole("link", { name: `Bekijk groot: ${firstImage.title} (nieuw tabblad)` });
    expect(link).toBeInstanceOf(HTMLAnchorElement);
    expect(link).toHaveAttribute("href", firstImage.src);
    expect(link).toHaveAttribute("target", "_blank");
    expect((link as HTMLAnchorElement).rel.split(/\s+/)).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
    expect(status()).toBeEmptyDOMElement();
    expect(status()).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByRole("textbox", { name: "Beeldlink" })).toBeNull();
  });

  it("copies only the canonical public URL for the current image, excluding unrelated location data", async () => {
    window.history.replaceState(null, "", "/another-page?utm_source=mail&owner_hint=private&filter=one&filter=two&beeld=old#unrelated");
    const writeText = vi.fn().mockResolvedValue(undefined);
    installClipboard(writeText);
    render(actions());
    clickCopy();
    expect(writeText).toHaveBeenCalledExactlyOnceWith(imageUrl());
    expect(await screen.findByText("Link gekopieerd.")).toBeInTheDocument();
    expect(copyButton()).toHaveFocus();
    expect(copyButton()).toHaveAttribute("aria-disabled", "false");
  });

  it("announces copying without claiming success before the clipboard promise resolves", async () => {
    const pending = deferredCopy();
    installClipboard(vi.fn().mockReturnValue(pending.promise));
    render(actions());
    clickCopy();
    expect(status()).toHaveTextContent("Beeldlink kopiëren…");
    expect(status()).not.toHaveTextContent("Link gekopieerd.");
    expect(copyButton()).toHaveAttribute("aria-disabled", "true");
    expect(copyButton()).toHaveFocus();
    expect(screen.queryByRole("textbox", { name: "Beeldlink" })).toBeNull();
    await settle(pending);
    expect(status()).toHaveTextContent("Link gekopieerd.");
    expect(copyButton()).toHaveAttribute("aria-disabled", "false");
  });

  it("deduplicates rapid activation while a copy is pending and permits a later deliberate copy", async () => {
    const pending = deferredCopy();
    const writeText = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(undefined);
    installClipboard(writeText);
    render(actions());
    clickCopy();
    fireEvent.click(copyButton());
    fireEvent.click(copyButton());
    expect(writeText).toHaveBeenCalledTimes(1);
    await settle(pending);
    clickCopy();
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Link gekopieerd.")).toBeInTheDocument();
  });

  it.each(["resolve", "reject"] as const)("ignores a late %s from the previous keyed image while the new image is copying", async (outcome) => {
    const oldCopy = deferredCopy();
    const newCopy = deferredCopy();
    const writeText = vi.fn().mockReturnValueOnce(oldCopy.promise).mockReturnValueOnce(newCopy.promise);
    installClipboard(writeText);
    const view = render(actions());
    clickCopy();
    view.rerender(actions(secondImage));
    expect(status()).toBeEmptyDOMElement();
    expect(copyButton()).toHaveAttribute("aria-disabled", "false");
    clickCopy();
    await settle(oldCopy, outcome);
    expect(status()).toHaveTextContent("Beeldlink kopiëren…");
    expect(copyButton()).toHaveAttribute("aria-disabled", "true");
    expect(copyButton()).toHaveFocus();
    expect(screen.queryByRole("textbox", { name: "Beeldlink" })).toBeNull();
    expect(writeText).toHaveBeenNthCalledWith(1, imageUrl(firstImage));
    expect(writeText).toHaveBeenNthCalledWith(2, imageUrl(secondImage));
    await settle(newCopy);
    expect(status()).toHaveTextContent("Link gekopieerd.");
    expect(copyButton()).toHaveAttribute("aria-disabled", "false");
  });

  it.each(["resolve", "reject"] as const)("keeps actions closed and outside focus intact after an unmounted request later %ss", async (outcome) => {
    const pending = deferredCopy();
    installClipboard(vi.fn().mockReturnValue(pending.promise));
    const view = render(actions());
    clickCopy();
    view.rerender(actions(firstImage, false));
    otherControl().focus();
    await settle(pending, outcome);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Beeldlink" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Kopieer beeldlink" })).toBeNull();
    expect(otherControl()).toHaveFocus();
  });

  it.each(["missing clipboard", "missing writeText"])("offers a focused, fully selected manual URL for %s", async (missing) => {
    installClipboard(undefined, missing !== "missing clipboard");
    render(actions());
    clickCopy();
    const input = await screen.findByRole("textbox", { name: "Beeldlink" }) as HTMLInputElement;
    expect(input).toHaveValue(imageUrl());
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveFocus();
    // Exercise jsdom's actual selection support; do not mock input.select().
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
    expect(status()).toHaveTextContent("Selecteer en kopieer de beeldlink.");
    expect(status()).not.toHaveTextContent("Link gekopieerd.");
    expect(copyButton()).toHaveAttribute("aria-disabled", "false");
  });

  it("falls back after clipboard rejection and selects the complete URL again when the field is revisited", async () => {
    installClipboard(vi.fn().mockRejectedValue(new Error("Not allowed")));
    render(actions());
    clickCopy();
    const input = await screen.findByRole("textbox", { name: "Beeldlink" }) as HTMLInputElement;
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
    input.setSelectionRange(4, 8);
    otherControl().focus();
    input.focus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
    expect(status()).toHaveTextContent("Selecteer en kopieer de beeldlink.");
  });

  it("shows a late rejected-copy fallback without stealing focus after the visitor moves on", async () => {
    const pending = deferredCopy();
    installClipboard(vi.fn().mockReturnValue(pending.promise));
    render(actions());
    clickCopy();
    otherControl().focus();
    await settle(pending, "reject");
    expect(manualField()).toHaveValue(imageUrl());
    expect(otherControl()).toHaveFocus();
    expect(manualField()).not.toHaveFocus();
    expect(status()).toHaveTextContent("Selecteer en kopieer de beeldlink.");
  });

  it.each(["copied", "manual"] as const)("clears %s status and any fallback when the keyed image changes", async (result) => {
    installClipboard(result === "copied" ? vi.fn().mockResolvedValue(undefined) : vi.fn().mockRejectedValue(new Error("Not allowed")));
    const view = render(actions());
    clickCopy();
    if (result === "copied") await screen.findByText("Link gekopieerd.");
    else await screen.findByRole("textbox", { name: "Beeldlink" });
    view.rerender(actions(secondImage));
    expect(status()).toBeEmptyDOMElement();
    expect(screen.queryByRole("textbox", { name: "Beeldlink" })).toBeNull();
    expect(copyButton()).toHaveAttribute("aria-disabled", "false");
    expect(screen.getByRole("link", { name: `Bekijk groot: ${secondImage.title} (nieuw tabblad)` })).toHaveAttribute("href", secondImage.src);
  });

  it("clears the manual fallback during a fresh attempt and reports success only after that attempt completes", async () => {
    const retry = deferredCopy();
    const writeText = vi.fn().mockRejectedValueOnce(new Error("Permission denied")).mockReturnValueOnce(retry.promise);
    installClipboard(writeText);
    render(actions());
    clickCopy();
    await screen.findByRole("textbox", { name: "Beeldlink" });
    clickCopy();
    expect(status()).toHaveTextContent("Beeldlink kopiëren…");
    expect(screen.queryByRole("textbox", { name: "Beeldlink" })).toBeNull();
    expect(copyButton()).toHaveFocus();
    expect(writeText).toHaveBeenCalledTimes(2);
    await settle(retry);
    expect(status()).toHaveTextContent("Link gekopieerd.");
    expect(copyButton()).toHaveAttribute("aria-disabled", "false");
  });
});
