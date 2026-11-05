import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Expand, X } from "lucide-react";
import { albumVisualChapters, albumVisualStory, resolveAlbumVisualStoryId, type AlbumVisualStoryImage } from "@/data/albumVisualStory";
import "@/styles/album-visual-story.css";

const hero = albumVisualStory.find((image) => image.id === "toen-in-nu")!;

function Artwork({ image, onReady, onRetry }: { image: AlbumVisualStoryImage; onReady: () => void; onRetry: () => void }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
      setStatus("ready");
      onReady();
    }
  }, [onReady]);

  return <div className="avs-artwork" data-state={status} aria-busy={status === "loading"}>
    <div className="avs-artwork__preview" style={{ backgroundImage: `url(${image.thumbnail})` }} aria-hidden="true" />
    {status !== "error" && <img ref={imageRef} src={`${image.src}${attempt ? `?retry=${attempt}` : ""}`} width={image.width} height={image.height} alt={image.alt} decoding="async"
      onLoad={() => { setStatus("ready"); onReady(); }} onError={() => setStatus("error")} />}
    {status === "loading" && <span className="avs-artwork__status" role="status">Beeld laden…</span>}
    {status === "error" && <div className="avs-artwork__error" role="status"><p>Dit beeld kon niet laden.</p><button type="button" onClick={() => { onRetry(); setAttempt((value) => value + 1); setStatus("loading"); }}>Opnieuw proberen</button><span>Je kunt ook verder naar het volgende beeld.</span></div>}
  </div>;
}

/** A single history entry keeps Browser Back as a natural way out of the gallery. */
export default function AlbumVisualStory() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const imageId = resolveAlbumVisualStoryId(params.get("beeld"));
  const index = albumVisualStory.findIndex((image) => image.id === imageId);
  const current = albumVisualStory[index];
  const isOpen = !!current;
  const chapter = albumVisualChapters.find((item) => item.id === current?.chapter);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const triggerTop = useRef<number | null>(null);
  const fallbackTrigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const figure = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const thumbs = useRef<Array<HTMLButtonElement | null>>([]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const closing = useRef(false);
  const moveArtworkFocus = useRef(false);
  const [readyId, setReadyId] = useState<string | null>(null);
  const markReady = useCallback(() => setReadyId(current?.id ?? null), [current?.id]);

  function selectImage(next: number, opener?: HTMLButtonElement, focusArtwork = false) {
    const image = albumVisualStory[next];
    if (!image) return;
    if (next === index) {
      if (focusArtwork) figure.current?.focus({ preventScroll: true });
      if (body.current) body.current.scrollTop = 0;
      return;
    }
    moveArtworkFocus.current = focusArtwork;
    const search = new URLSearchParams(location.search);
    search.set("beeld", image.id);
    if (opener) {
      trigger.current = opener;
      triggerTop.current = opener.getBoundingClientRect().top;
    }
    navigate({ pathname: location.pathname, search: search.toString(), hash: location.hash }, {
      replace: !!current,
      preventScrollReset: true,
      state: current ? location.state : { ...location.state, albumVisualStory: location.pathname },
    });
  }

  function close() {
    if (closing.current) return;
    closing.current = true;
    if (location.state?.albumVisualStory === location.pathname) navigate(-1);
    else {
      const search = new URLSearchParams(location.search);
      search.delete("beeld");
      navigate({ pathname: location.pathname, search: search.toString(), hash: location.hash }, { replace: true, preventScrollReset: true, state: location.state });
    }
  }

  useEffect(() => { closing.current = false; }, [location.key]);
  useEffect(() => {
    if (!isOpen) return;
    const root = document.getElementById("root");
    if (!root) return;
    // Also isolate background controls that mount later, such as cookie consent.
    // The dialog is portalled beside this root, so its controls stay available.
    const wasInert = root.hasAttribute("inert");
    root.setAttribute("inert", "");
    return () => { if (!wasInert) root.removeAttribute("inert"); };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, [isOpen]);

  useEffect(() => {
    if (!current) return;
    const thumb = thumbs.current[index];
    if (moveArtworkFocus.current) { figure.current?.focus({ preventScroll: true }); moveArtworkFocus.current = false; }
    if (body.current) body.current.scrollTop = 0;
    // Move only the horizontal strip, never the page or the artwork above it.
    if (thumb && strip.current) {
      const button = thumb.getBoundingClientRect();
      const list = strip.current.getBoundingClientRect();
      if (button.left < list.left) strip.current.scrollLeft += button.left - list.left - 8;
      else if (button.right > list.right) strip.current.scrollLeft += button.right - list.right + 8;
    }
  }, [current, index]);

  useEffect(() => {
    if (!current || readyId !== current.id || document.visibilityState === "hidden") return;
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
    const next = albumVisualStory[index + 1];
    if (next) { const preload = new Image(); preload.src = next.src; }
  }, [current, index, readyId]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || (event.target as HTMLElement).closest("select, input, textarea, [contenteditable=true]")) return;
    const next = event.key === "ArrowLeft" ? Math.max(0, index - 1) : event.key === "ArrowRight" ? Math.min(albumVisualStory.length - 1, index + 1)
      : event.key === "Home" ? 0 : event.key === "End" ? albumVisualStory.length - 1 : undefined;
    if (next === undefined) return;
    event.preventDefault();
    if (next === index) return;
    selectImage(next, undefined, !!(event.target as HTMLElement).closest("[data-gallery-thumbnail]"));
  }

  function onTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || event.changedTouches.length !== 1 || (window.visualViewport?.scale ?? 1) > 1) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) selectImage(index + (dx < 0 ? 1 : -1));
  }

  return <section className="avs-story" id="album-world" aria-labelledby="avs-heading">
    <div className="ma-section-heading"><div><p className="ma-eyebrow">IETS MOOIS / Het beeldverhaal</p><h2 id="avs-heading">Eén gezicht.<br />Meer dan één verhaal.</h2></div><p className="avs-intro">Een open blik. Iets van toen. En ruimte voor wat jij erin ziet.</p></div>
    <div className="avs-story__layout">
      <button ref={fallbackTrigger} type="button" className="avs-cover" aria-haspopup="dialog" onClick={(event) => selectImage(albumVisualStory.indexOf(hero), event.currentTarget)}>
        <img src={hero.src} width={hero.width} height={hero.height} alt="Jowikroon kijkt over zijn bril. In het glas kijkt een kind terug." loading="lazy" decoding="async" />
        <span className="avs-cover__action"><span><Expand size={17} aria-hidden="true" />Open het beeldverhaal</span><span>{albumVisualStory.length} beelden <ArrowUpRight size={19} aria-hidden="true" /></span></span>
      </button>
      <div className="avs-entry">
        <div className="avs-entry__intro"><p className="ma-eyebrow">Begin waar je iets herkent</p><p>De blik, het licht, de kleine afwijking. Vier ingangen in de wereld van de plaat.</p></div>
        <div className="avs-lasers" role="group" aria-label="Kies een ingang in het beeldverhaal">
          {albumVisualChapters.map((item, chapterIndex) => {
            const cover = albumVisualStory.find((image) => image.id === item.coverId)!;
            const count = albumVisualStory.filter((image) => image.chapter === item.id).length;
            return <button key={item.id} type="button" className="avs-laser" aria-haspopup="dialog" onClick={(event) => selectImage(albumVisualStory.indexOf(cover), event.currentTarget)}>
              <img src={cover.thumbnail} width={64} height={64} alt="" loading="lazy" decoding="async" />
              <span className="avs-laser__copy"><span className="avs-laser__index">0{chapterIndex + 1} / {count} beelden</span><strong>{item.title}</strong></span>
              <ArrowUpRight size={20} className="avs-laser__arrow" aria-hidden="true" />
            </button>;
          })}
        </div>
        <a href="#album-origin" className="avs-reading-link">Liever eerst de woorden? <span>Lees het verhaal <ArrowDown size={15} aria-hidden="true" /></span></a>
      </div>
    </div>
    <Dialog.Root open={!!current} onOpenChange={(open) => { if (!open) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="avs-backdrop" />
        <Dialog.Content className="avs-dialog" lang="nl" onKeyDown={onKeyDown}
          onOpenAutoFocus={(event) => { event.preventDefault(); closeButton.current?.focus(); }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (trigger.current?.isConnected) {
              trigger.current.focus({ preventScroll: true });
              if (triggerTop.current !== null) window.scrollBy({ top: trigger.current.getBoundingClientRect().top - triggerTop.current, behavior: "instant" });
            } else fallbackTrigger.current?.focus();
          }}>
          <header className="avs-dialog__header"><div><Dialog.Title>IETS MOOIS</Dialog.Title><Dialog.Description>Het album in beelden</Dialog.Description></div><Dialog.Close ref={closeButton} type="button" className="avs-close" aria-label="Sluit het beeldverhaal"><span>Sluiten</span><X size={21} aria-hidden="true" /></Dialog.Close></header>
          {current && <>
            <div className="avs-dialog__body" ref={body}>
              <figure className="avs-figure" ref={figure} tabIndex={-1} aria-label={`Beeld ${index + 1} van ${albumVisualStory.length}: ${current.title}`} onTouchStart={(event) => { touchStart.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }} onTouchEnd={onTouchEnd} onTouchCancel={() => { touchStart.current = null; }}>
                <Artwork key={current.id} image={current} onReady={markReady} onRetry={() => figure.current?.focus({ preventScroll: true })} />
                <figcaption className="avs-caption"><span className="avs-caption__chapter">{chapter?.title}{current.status === "Volgordestudie" && " / Voorgestelde volgorde"}</span><h3>{current.title}</h3><p>{current.caption}</p></figcaption>
              </figure>
              <div className="avs-dialog__rail">
                <div className="avs-chapter-select"><label htmlFor="avs-chapter">Ontdek een ander hoofdstuk</label><select id="avs-chapter" value={current.chapter} onChange={(event) => { const next = albumVisualStory.findIndex((image) => image.chapter === event.target.value); selectImage(next, undefined, true); }}>{albumVisualChapters.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
                <div className="avs-thumbnail-area"><p>Alle {albumVisualStory.length} beelden</p><div className="avs-thumbnails" ref={strip} role="group" aria-label={`Kies uit alle ${albumVisualStory.length} beelden`}>
                  {albumVisualStory.map((image, position) => <button type="button" key={image.id} data-gallery-thumbnail={image.id} ref={(element) => { thumbs.current[position] = element; }} tabIndex={position === index ? 0 : -1} aria-label={`Beeld ${position + 1}: ${image.title}`} aria-current={position === index ? "true" : undefined} onClick={() => selectImage(position, undefined, true)}><img src={image.thumbnail} width={60} height={60} alt="" loading="lazy" decoding="async" /><span aria-hidden="true">{String(position + 1).padStart(2, "0")}</span></button>)}
                </div></div>
              </div>
            </div>
            <footer className="avs-controls"><button type="button" onClick={() => selectImage(index - 1)} aria-disabled={index === 0} aria-label="Vorig beeld"><ArrowLeft size={20} aria-hidden="true" /><span>Vorige</span></button><p><span className="avs-counter">{String(index + 1).padStart(2, "0")}<span> / {albumVisualStory.length}</span></span><span className="avs-key-hint">← → bladeren · Esc sluiten</span></p><button type="button" onClick={() => selectImage(index + 1)} aria-disabled={index === albumVisualStory.length - 1} aria-label="Volgend beeld"><span>Volgende</span><ArrowRight size={20} aria-hidden="true" /></button></footer>
            <p className="avs-sr-only" role="status" aria-live="polite" aria-atomic="true">Beeld {index + 1} van {albumVisualStory.length}: {current.title}.</p>
          </>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </section>;
}
