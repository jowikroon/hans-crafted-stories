import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Link, useNavigate } from "react-router-dom";
import { getAlbum } from "@/data/albums";
import AlbumPageTemplate from "./AlbumPageTemplate";

const scrollTo = vi.fn();
const scrollIntoView = vi.fn();

beforeEach(() => {
  vi.stubGlobal("scrollTo", scrollTo);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { value: scrollIntoView, configurable: true });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); delete HTMLElement.prototype.scrollIntoView; });

function AlbumNavigation() {
  const navigate = useNavigate();
  return <AlbumPageTemplate album={getAlbum("iets-moois")!}>
    <Link to="/music/albums/neon-the-signal-between#album-tracks">Naar de singles</Link>
    <button onClick={() => navigate("?song=beat-drop")}>Open een song</button>
    <section id="album-tracks">De singles</section>
  </AlbumPageTemplate>;
}

const showAlbum = (hash = "") => render(<MemoryRouter initialEntries={[`/music/albums/iets-moois${hash}`]}><AlbumNavigation /></MemoryRouter>);

describe("album navigation position", () => {
  it("leaves the browser's initial/back position alone", () => {
    showAlbum();
    expect(scrollTo).not.toHaveBeenCalled();
  });
  it("starts a newly selected album at the top", () => {
    showAlbum();
    fireEvent.click(screen.getByRole("link", { name: /NEON/ }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
  });
  it("lands a story's listen link at the tracks on the destination page", () => {
    showAlbum();
    fireEvent.click(screen.getByRole("link", { name: "Naar de singles" }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "instant", block: "start" });
    expect(scrollTo).not.toHaveBeenCalled();
  });
  it("keeps the reading position when a song opens via the query string", () => {
    showAlbum("#album-tracks");
    scrollIntoView.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Open een song" }));
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
