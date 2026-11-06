import { useEffect, useRef, useState } from "react";
import type { AlbumPreviewTrack } from "@/data/albumPreviews";
import type { AlbumPrivateDetails } from "@/hooks/useAlbumPrivateDetails";
import MusicPlayer, { type PlaybackStatus } from "./MusicPlayer";

/** One user-started SoundCloud widget at a time. No playlist or hidden titles. */
export default function AlbumPreviewListening({ tracks, totalTracks, ownerTracks, album, onStart, stopForOtherAudio = false }: {
  tracks: readonly AlbumPreviewTrack[];
  totalTracks: number;
  ownerTracks?: AlbumPrivateDetails["tracks"];
  album: "iets-moois" | "neon";
  onStart?: () => void;
  stopForOtherAudio?: boolean;
}) {
  const [activePosition, setActivePosition] = useState<number | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>("ready");
  const [attempt, setAttempt] = useState(0);
  const control = useRef<{ play: () => void; pause: () => void } | null>(null);
  const triggers = useRef<Map<number, HTMLButtonElement>>(new Map());
  const neon = album === "neon";

  useEffect(() => () => { control.current?.pause(); }, []);
  useEffect(() => {
    if (!stopForOtherAudio) return;
    control.current?.pause();
    setActivePosition(null);
    setStatus("ready");
  }, [stopForOtherAudio]);

  const close = (restoreFocus = false) => {
    const position = activePosition;
    control.current?.pause();
    setActivePosition(null);
    setStatus("ready");
    if (restoreFocus && position !== null) triggers.current.get(position)?.focus({ preventScroll: true });
  };

  const toggle = (position: number) => {
    if (activePosition !== position) {
      onStart?.();
      control.current?.pause();
      setStatus("loading");
      setAttempt(0);
      setActivePosition(position);
      return;
    }
    if (status === "loading") close();
    else if (status === "error") { setStatus("loading"); setAttempt((current) => current + 1); }
    else if (status === "playing") control.current?.pause();
    else { onStart?.(); control.current?.play(); }
  };

  const futurePositions = Array.from({ length: Math.max(0, totalTracks - tracks.length) }, (_, index) => index + tracks.length + 1);
  return <section className="ma-track-section ma-track-section--previews" id="album-tracks" aria-labelledby="ma-tracks-title">
    <div className="ma-section-heading">
      <div><p className="ma-eyebrow">{neon ? "NEON Official / voorproefje" : "Luister alvast"}</p><h2 id="ma-tracks-title">{neon ? "Het signaal wordt hoorbaar." : "Het begint met luisteren."}</h2></div>
      <span className="ma-section-heading__count">{neon ? `${tracks.length} privé-opnamen uit de playlist` : `${tracks.length} van ${totalTracks} nummers te beluisteren`}</span>
    </div>
    <p className="ma-preview__intro">{neon ? "Vier signalen om alvast te beluisteren. De volgorde hieronder komt uit de SoundCloud-playlist, niet uit de definitieve albumtracklist." : "Vier nummers zijn hier alvast te horen. De overige acht krijgen hun plek wanneer ze klaar zijn."}</p>
    <ol className="ma-tracklist ma-preview__tracks" aria-label={neon ? "Vier opnamen uit de NEON Official-playlist" : "Vier IETS MOOIS-nummers"}>
      {tracks.map((track) => {
        const selected = activePosition === track.position;
        const playing = selected && status === "playing";
        const loading = selected && status === "loading";
        return <li className="ma-track ma-track--preview" id={neon ? `neon-preview-${track.position}` : `album-track-${track.position}`} key={track.soundcloudTrackId}>
          <span className="ma-track__number">{String(track.position).padStart(2, "0")}</span>
          <button ref={(element) => { if (element) triggers.current.set(track.position, element); else triggers.current.delete(track.position); }} type="button" className="ma-track__play" aria-label={`${playing ? "Pauzeer" : loading ? "Stop laden van" : "Speel"} ${track.title}`} aria-pressed={playing} onClick={() => toggle(track.position)}>
            <span aria-hidden="true">{loading ? "···" : playing ? "Ⅱ" : "▶"}</span>
          </button>
          <div className="ma-track__copy"><strong>{track.title}</strong><span>{track.versionNote ?? (neon ? "Privémaster · websitepreview" : "Alvast te beluisteren · Jowikroon")}</span></div>
          <span className="ma-track__duration">{track.duration}</span>
          <span className="ma-preview__availability">Hier te horen</span>
          {selected && <div className="ma-preview__audio" aria-label={`Speler voor ${track.title}`}>
            <div className="ma-preview__player-top"><span role="status" aria-live="polite">{status === "playing" ? "Speelt nu" : status === "paused" ? "Gepauzeerd" : status === "loading" ? "Speler wordt geladen…" : status === "error" ? "Afspelen is niet gelukt." : "Klaar om af te spelen"}</span><button type="button" onClick={() => close(true)} aria-label={`Sluit speler voor ${track.title}`}>Sluiten ×</button></div>
            <MusicPlayer key={`${track.position}-${attempt}`} song={track} onStatus={setStatus} control={control} />
            {status === "error" && <button className="ma-preview__retry" type="button" onClick={() => toggle(track.position)}>Probeer opnieuw</button>}
          </div>}
        </li>;
      })}
    </ol>
    <div className="ma-preview__future">
      <p className="ma-eyebrow">{neon ? "Nog niet het hele album" : "Het verhaal gaat verder"}</p>
      <p className="ma-preview__future-note">{neon ? `NEON heeft ${totalTracks} geplande albumposities. Twee singles zijn al officieel uitgebracht; de uiteindelijke volgorde blijft nog open.` : `Nog ${futurePositions.length} plekken. De volgorde en titels volgen later.`}</p>
      {!neon && <ol className="ma-preview__future-list" start={tracks.length + 1} aria-label="Nog niet aangekondigde nummers">
        {futurePositions.map((position) => {
          const ownerTrack = ownerTracks?.find((track) => track.position === position);
          return <li key={position} aria-label={`Nummer ${position}: ${ownerTrack ? `${ownerTrack.title}, alleen voor jou` : "nog niet aangekondigd"}`}>
            <span className="ma-preview__future-number">{String(position).padStart(2, "0")}</span>
            {ownerTrack ? <span className="ma-preview__owner-title">{ownerTrack.title}</span> : <span className="ma-blur-mark" aria-hidden="true" />}
          </li>;
        })}
      </ol>}
    </div>
    <p className="ma-track-note">{neon ? "De SoundCloud-speler laadt pas na een klik. Deze vier privémasters staan niet op je openbare SoundCloud-profiel, maar iedereen met een gedeelde luisterlink kan ze horen." : "De afspeelknop laadt een SoundCloud-speler. Deze privé-opnamen staan niet op het openbare SoundCloud-profiel, maar de luisterlink kan worden gedeeld."} <a href="/privacy">Lees meer over privacy</a>.</p>
  </section>;
}
