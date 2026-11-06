import { useEffect, useRef, useState } from "react";
import { ietsMooisPreviews } from "@/data/ietsMooisPreviews";
import type { AlbumPrivateDetails } from "@/hooks/useAlbumPrivateDetails";
import MusicPlayer, { type PlaybackStatus } from "./MusicPlayer";

/** The website previews are not official single releases or a complete tracklist. */
export default function IetsMooisPreviews({ totalTracks, ownerTracks }: {
  totalTracks: number;
  ownerTracks?: AlbumPrivateDetails["tracks"];
}) {
  const [activePosition, setActivePosition] = useState<number | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>("ready");
  const [attempt, setAttempt] = useState(0);
  const control = useRef<{ play: () => void; pause: () => void } | null>(null);

  useEffect(() => () => { control.current?.pause(); }, []);

  const toggle = (position: number) => {
    if (activePosition !== position) {
      control.current?.pause();
      setStatus("loading");
      setAttempt(0);
      setActivePosition(position);
      return;
    }
    if (status === "loading") {
      setActivePosition(null);
      setStatus("ready");
    } else if (status === "error") {
      setStatus("loading");
      setAttempt((current) => current + 1);
    } else if (status === "playing") {
      control.current?.pause();
    } else {
      control.current?.play();
    }
  };

  const futurePositions = Array.from({ length: Math.max(0, totalTracks - ietsMooisPreviews.length) }, (_, index) => index + ietsMooisPreviews.length + 1);

  return <section className="ma-track-section ma-track-section--previews" id="album-tracks" aria-labelledby="ma-tracks-title">
    <div className="ma-section-heading">
      <div><p className="ma-eyebrow">Luister alvast</p><h2 id="ma-tracks-title">Het begint met luisteren.</h2></div>
      <span className="ma-section-heading__count">{ietsMooisPreviews.length} van {totalTracks} nummers te beluisteren</span>
    </div>
    <p className="ma-preview__intro">Vier nummers zijn hier alvast te horen. De overige acht krijgen hun plek wanneer ze klaar zijn.</p>
    <ol className="ma-tracklist ma-preview__tracks">
      {ietsMooisPreviews.map((track) => {
        const selected = activePosition === track.position;
        const playing = selected && status === "playing";
        const loading = selected && status === "loading";
        return <li className="ma-track ma-track--preview" id={`album-track-${track.position}`} key={track.soundcloudTrackId}>
          <span className="ma-track__number">{String(track.position).padStart(2, "0")}</span>
          <button type="button" className="ma-track__play" aria-label={`${playing ? "Pauzeer" : loading ? "Stop laden van" : "Speel"} ${track.title}`} aria-pressed={playing} onClick={() => toggle(track.position)}>
            <span aria-hidden="true">{loading ? "···" : playing ? "Ⅱ" : "▶"}</span>
          </button>
          <div className="ma-track__copy"><strong>{track.title}</strong><span>{track.versionNote ?? "Alvast te beluisteren · Jowikroon"}</span></div>
          <span className="ma-track__duration">{track.duration}</span>
          <span className="ma-preview__availability">Hier te horen</span>
          {selected && <div className="ma-preview__audio" aria-label={`Speler voor ${track.title}`}>
            <div className="ma-preview__player-top"><span role="status" aria-live="polite">{status === "playing" ? "Speelt nu" : status === "paused" ? "Gepauzeerd" : status === "loading" ? "Speler wordt geladen…" : status === "error" ? "Afspelen is niet gelukt." : "Klaar om af te spelen"}</span><button type="button" onClick={() => { control.current?.pause(); setActivePosition(null); setStatus("ready"); }} aria-label={`Sluit speler voor ${track.title}`}>Sluiten ×</button></div>
            <MusicPlayer key={`${track.position}-${attempt}`} song={track} onStatus={setStatus} control={control} />
            {status === "error" && <button className="ma-preview__retry" type="button" onClick={() => toggle(track.position)}>Probeer opnieuw</button>}
          </div>}
        </li>;
      })}
    </ol>
    <div className="ma-preview__future">
      <p className="ma-eyebrow">Het verhaal gaat verder</p>
      <p className="ma-preview__future-note">Nog {futurePositions.length} plekken. De volgorde en titels volgen later.</p>
      <ol className="ma-preview__future-list" start={ietsMooisPreviews.length + 1} aria-label="Nog niet aangekondigde nummers">
        {futurePositions.map((position) => {
          const ownerTrack = ownerTracks?.find((track) => track.position === position);
          return <li key={position} aria-label={`Nummer ${position}: ${ownerTrack ? `${ownerTrack.title}, alleen voor jou` : "nog niet aangekondigd"}`}>
            <span className="ma-preview__future-number">{String(position).padStart(2, "0")}</span>
            {ownerTrack ? <span className="ma-preview__owner-title">{ownerTrack.title}</span> : <span className="ma-blur-mark" aria-hidden="true" />}
          </li>;
        })}
      </ol>
    </div>
    <p className="ma-track-note">De afspeelknop laadt een SoundCloud-speler. Deze privé-opnamen staan niet op het openbare SoundCloud-profiel, maar de luisterlink kan worden gedeeld. <a href="/privacy">Lees meer over privacy</a>.</p>
  </section>;
}
