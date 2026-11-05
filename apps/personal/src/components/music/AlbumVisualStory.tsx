import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Maximize2, X } from "lucide-react";
import { albumStoryImage, ietsMooisVisualStory as images } from "@/data/albumVisualStory";
import "@/styles/music-album-visual-story.css";

/** Four direct entry points, one modal, no automatic movement or audio. */
export default function AlbumVisualStory() {
  const headingId = useId();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedImage = new URLSearchParams(location.search).get("beeld");
  const requestedIndex = images.findIndex((item) => item.id === requestedImage);
  const activeIndex = requestedIndex < 0 ? null : requestedIndex;
  const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(new Set());
  const opener = useRef<HTMLButtonElement | null>(null);
  const entryButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const lastViewed = useRef(activeIndex ?? 0);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const scrollBody = useRef<HTMLDivElement | null>(null);
  const nextButton = useRef<HTMLButtonElement | null>(null);
  const openedFrom = useRef<string | null>(null);
  const closing = useRef(false);
  const selected = images[activeIndex ?? 0];
  const failed = failedImages.has(selected.id);

  useEffect(() => {
    if (activeIndex !== null) {
      lastViewed.current = activeIndex;
      // Always show the newly chosen artwork, including after reading a mobile caption.
      if (scrollBody.current) scrollBody.current.scrollTop = 0;
    } else closing.current = false;
  }, [activeIndex]);

  function selectImage(index: number) {
    const search = new URLSearchParams(location.search);
    search.set("beeld", images[index].id);
    const opening = activeIndex === null;
    if (opening) openedFrom.current = location.key;
    navigate({ pathname: location.pathname, search: search.toString(), hash: location.hash }, {
      replace: !opening,
      preventScrollReset: true,
      state: opening ? { ...location.state, albumVisualStoryFrom: location.key } : location.state,
    });
  }

  function close() {
    if (activeIndex === null || closing.current) return;
    closing.current = true;
    // Back dismisses an overlay opened here. A direct URL closes in place and
    // never sends a visitor to an unknown previous website.
    if (openedFrom.current !== null && location.state?.albumVisualStoryFrom === openedFrom.current) {
      navigate(-1);
    } else {
      const search = new URLSearchParams(location.search);
      search.delete("beeld");
      navigate({ pathname: location.pathname, search: search.toString(), hash: location.hash }, { replace: true, preventScrollReset: true, state: location.state });
    }
  }

  function move(offset: number) {
    if (activeIndex !== null) selectImage((activeIndex + offset + images.length) % images.length);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      selectImage(event.key === "Home" ? 0 : images.length - 1);
    } else return;
    if (scrollBody.current?.contains(event.target as Node)) nextButton.current?.focus({ preventScroll: true });
  }

  function retryImage() {
    setFailedImages((previous) => {
      const next = new Set(previous);
      next.delete(selected.id);
      return next;
    });
  }

  return <section className="ma-visual-story" id="album-world" aria-labelledby={headingId}>
    <div className="ma-visual-story__intro">
      <div>
        <p className="ma-eyebrow">IETS MOOIS / In beeld</p>
        <h2 id={headingId}>Vier beelden.<br />Eén verhaal.</h2>
      </div>
      <p>Open een beeld en kijk dichterbij.</p>
    </div>

    <Dialog.Root open={activeIndex !== null} onOpenChange={(open) => { if (!open) close(); }}>
      <div className="ma-visual-story__grid">
        {images.map((item, index) => <button
          type="button"
          className="ma-laser-card"
          key={item.id}
          aria-haspopup="dialog"
          aria-label={`Bekijk ${item.title.toLowerCase()}`}
          ref={(element) => { entryButtons.current[index] = element; }}
          onClick={(event) => { opener.current = event.currentTarget; selectImage(index); }}
        >
          <span className="ma-laser-card__image">
            <img src={albumStoryImage(item.id, true)} alt="" width={480} height={480} loading="lazy" decoding="async" />
            <span className="ma-laser-card__expand" aria-hidden="true"><Maximize2 size={17} strokeWidth={1.5} /></span>
          </span>
          <span className="ma-laser-card__label"><span className="ma-laser-card__number" aria-hidden="true">0{index + 1}</span><span>{item.title}</span><ArrowRight size={18} aria-hidden="true" /></span>
        </button>)}
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="ma-art-overlay" />
        <Dialog.Content
          className="ma-art-dialog"
          lang="nl"
          aria-modal="true"
          onKeyDown={onKeyDown}
          onOpenAutoFocus={(event) => { event.preventDefault(); closeButton.current?.focus(); }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = opener.current ?? entryButtons.current[lastViewed.current];
            if (target?.isConnected) target.focus({ preventScroll: Boolean(opener.current) });
          }}
        >
          <header className="ma-art-dialog__header">
            <div><span className="ma-art-dialog__artist">Jowikroon</span><Dialog.Title>IETS MOOIS in beeld</Dialog.Title></div>
            <Dialog.Close className="ma-art-dialog__close" ref={closeButton}><span>Sluiten</span><X size={20} aria-hidden="true" /></Dialog.Close>
          </header>

          <div className="ma-art-dialog__body" ref={scrollBody}>
            <figure className="ma-art-dialog__figure">
              <div className="ma-art-dialog__art">
                {failed ? <div className="ma-art-dialog__error" role="status"><p>Dit beeld kon niet laden.</p><button type="button" onClick={retryImage}>Probeer opnieuw</button></div> : <img
                  key={selected.id}
                  src={albumStoryImage(selected.id)}
                  alt={selected.alt}
                  width={1254}
                  height={1254}
                  decoding="async"
                  onError={() => setFailedImages((previous) => new Set(previous).add(selected.id))}
                />}
              </div>
              <figcaption className="ma-art-dialog__caption">
                <div className="ma-art-dialog__copy">
                  <p className="ma-art-dialog__principle">{selected.principle}</p>
                  <h3>{selected.title}</h3>
                  <Dialog.Description>{selected.description}</Dialog.Description>
                </div>
                <div className="ma-art-dialog__choices" role="group" aria-label="Kies een beeld">
                  {images.map((item, index) => <button
                    type="button"
                    key={item.id}
                    className="ma-art-dialog__choice"
                    aria-label={`Toon ${item.title.toLowerCase()}`}
                    aria-pressed={activeIndex === index}
                    onClick={() => { selectImage(index); nextButton.current?.focus({ preventScroll: true }); }}
                  ><img src={albumStoryImage(item.id, true)} alt="" width={480} height={480} decoding="async" /><span aria-hidden="true">0{index + 1}</span></button>)}
                </div>
              </figcaption>
            </figure>
          </div>

          <footer className="ma-art-dialog__footer">
            <button type="button" onClick={() => move(-1)} aria-label="Vorig beeld"><ArrowLeft size={20} aria-hidden="true" /><span>Vorige</span></button>
            <p className="ma-art-dialog__position" role="status" aria-live="polite" aria-atomic="true"><span className="ma-art-dialog__position-label">{selected.title}</span><span><span className="ma-art-dialog__sr-only">Beeld </span>{(activeIndex ?? 0) + 1} <span className="ma-art-dialog__position-divider">/</span> <span className="ma-art-dialog__sr-only">van </span>{images.length}</span></p>
            <button type="button" ref={nextButton} onClick={() => move(1)} aria-label="Volgend beeld"><span>Volgende</span><ArrowRight size={20} aria-hidden="true" /></button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </section>;
}
