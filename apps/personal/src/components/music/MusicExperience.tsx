import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSearchParams } from "react-router-dom";
import { Link } from "@/components/LocalizedLink";
import { getSongBySlug } from "@/data/music";
import MusicSong from "@/pages/MusicSong";
import MusicPlayer, { type PlaybackStatus } from "./MusicPlayer";
import "@/styles/music-experience.css";

type Active = { slug: string; placement: string; attempt: number };
type Experience = {
  active: Active | null;
  status: PlaybackStatus;
  toggle: (slug: string, placement: string) => void;
  openSong: (slug: string, trigger?: HTMLElement) => void;
  stop: (restoreFocus?: boolean) => void;
  player: ReactNode;
};
const Context = createContext<Experience | null>(null);
// The context hook and its controls deliberately share one small public module.
// eslint-disable-next-line react-refresh/only-export-components
export function useMusicExperience() {
  const context = useContext(Context);
  if (!context) throw new Error("MusicExperience is missing");
  return context;
}

export function SongPageButton({ slug, className = "", tabIndex }: { slug: string; className?: string; tabIndex?: number }) {
  const { openSong } = useMusicExperience();
  const song = getSongBySlug(slug);
  return <button type="button" className={`mx-song-button ${className}`} data-song-page={slug} tabIndex={tabIndex} aria-haspopup="dialog" aria-label={`Open songpagina van ${song?.title ?? slug}`} onClick={(event) => openSong(slug, event.currentTarget)}>Songpagina <span aria-hidden="true">↗</span></button>;
}

export function PlaySongButton({ slug, placement, className = "", iconOnly = false }: { slug: string; placement: string; className?: string; iconOnly?: boolean }) {
  const { active, status, toggle } = useMusicExperience();
  const selected = active?.slug === slug && active.placement === placement;
  const playing = selected && status === "playing";
  const loading = selected && status === "loading";
  const song = getSongBySlug(slug);
  return <button type="button" className={`mx-play-button ${className}`} aria-label={`${playing ? "Pauzeer" : loading ? "Stop laden van" : "Speel"} ${song?.title ?? slug}`} aria-pressed={playing} onClick={() => toggle(slug, placement)}>
    <span aria-hidden="true">{loading ? "···" : playing ? "Ⅱ" : "▶"}</span>{!iconOnly && <span>{loading ? "Laden…" : playing ? "Pauzeer" : "Afspelen"}</span>}
  </button>;
}

export function SongPlayerSlot({ placement }: { placement: string }) {
  const { active, player } = useMusicExperience();
  return active?.placement === placement ? <div className="mx-player-slot">{player}</div> : null;
}

export default function MusicExperience({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Active | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>("ready");
  const control = useRef<{ play: () => void; pause: () => void } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const triggerTop = useRef<number | null>(null);
  const playTrigger = useRef<HTMLElement | null>(null);
  const [params, setParams] = useSearchParams();
  const modalSong = getSongBySlug(params.get("song") ?? undefined);
  const modalOpen = !!modalSong;
  const pushed = useRef(false);
  const stop = useCallback((restoreFocus = false) => {
    control.current?.pause();
    setActive(null);
    setStatus("ready");
    if (restoreFocus && playTrigger.current?.isConnected) playTrigger.current.focus({ preventScroll: true });
  }, []);
  const toggle = (slug: string, placement: string) => {
    if (active?.slug === slug && active.placement === placement) {
      if (status === "loading") stop();
      else if (status === "error") setActive({ slug, placement, attempt: active.attempt + 1 });
      else if (status === "playing") control.current?.pause();
      else control.current?.play();
    } else {
      stop();
      playTrigger.current = document.activeElement as HTMLElement;
      setStatus("loading");
      setActive({ slug, placement, attempt: 0 });
    }
  };
  const openSong = (slug: string, element?: HTMLElement) => {
    if (!getSongBySlug(slug)) return;
    if (!modalSong) {
      trigger.current = element ?? document.activeElement as HTMLElement;
      triggerTop.current = trigger.current?.getBoundingClientRect().top ?? null;
      pushed.current = true;
    }
    stop();
    const next = new URLSearchParams(params);
    next.set("song", slug);
    setParams(next, { replace: !!modalSong, preventScrollReset: true });
  };
  const close = () => {
    stop();
    if (pushed.current) { pushed.current = false; window.history.back(); }
    else { const next = new URLSearchParams(params); next.delete("song"); setParams(next, { replace: true, preventScrollReset: true }); }
  };
  // Browser Back/Forward also closes audio and swaps details without autoplay.
  useEffect(() => {
    stop();
    if (modalSong && !trigger.current) trigger.current = document.querySelector(`[data-song-page="${modalSong.slug}"]`);
  }, [modalSong, stop]);
  useEffect(() => {
    if (!modalOpen) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, [modalOpen]);
  const song = active ? getSongBySlug(active.slug) : undefined;
  const player = song && active ? <section className="mx-player" aria-label={`Speler voor ${song.title}`}>
    <div className="mx-player__heading"><span><strong>{song.title}</strong><small role="status" aria-live="polite">{status === "playing" ? "Speelt nu" : status === "loading" ? "Je muziek wordt geladen…" : status === "error" ? "De speler reageert niet. Probeer opnieuw of open de bron." : status === "paused" ? "Gepauzeerd" : "Klaar. Tik zo nodig op afspelen in de speler."}</small></span><button type="button" className="mx-close" aria-label="Stop muziek en sluit speler" onClick={() => stop(true)}>×</button></div>
    <MusicPlayer key={`${song.slug}-${active.attempt}`} song={song} onStatus={setStatus} control={control} />
    <div className="mx-player__footer">{status === "error" && <button type="button" onClick={() => setActive({ ...active, attempt: active.attempt + 1 })}>Opnieuw proberen</button>}<a href={song.listenUrl} target="_blank" rel="noopener noreferrer">Open in {song.provider === "spotify" ? "Spotify" : "SoundCloud"} ↗</a></div>
  </section> : null;
  return <Context.Provider value={{ active, status, toggle, openSong, stop, player }}>
    {children}
    <Dialog.Root open={!!modalSong} onOpenChange={(open) => { if (!open) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="mx-modal-overlay" />
        <Dialog.Content className="mx-song-modal" onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (trigger.current?.isConnected) {
            trigger.current.focus({ preventScroll: true });
            // Preserve the row's screen position even if images/fonts finish
            // loading behind the dialog or history restores an older offset.
            if (triggerTop.current !== null) window.scrollBy({ top: trigger.current.getBoundingClientRect().top - triggerTop.current, behavior: "instant" });
          }
        }}>
          <div className="mx-modal-heading">
            <div><Dialog.Title>{modalSong?.title}</Dialog.Title><Dialog.Description>Jowikroon · Het verhaal achter het nummer</Dialog.Description></div>
            <Dialog.Close className="mx-close" aria-label="Sluit songpagina">×</Dialog.Close>
          </div>
          <div className="mx-modal-scroll" key={modalSong?.slug}>
            {modalSong && <MusicSong songSlug={modalSong.slug} inDialog player={<><PlaySongButton slug={modalSong.slug} placement="dialog" /><SongPlayerSlot placement="dialog" /></>} onOpenSong={openSong} />}
            {modalSong && <Link className="mx-full-page" to={`/music/${modalSong.slug}`}>Open de volledige pagina <span aria-hidden="true">↗</span></Link>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </Context.Provider>;
}
