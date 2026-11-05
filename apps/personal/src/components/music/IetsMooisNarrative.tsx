import { ArrowDown, ArrowUpRight, Expand } from "lucide-react";
import { albumVisualStory } from "@/data/albumVisualStory";
import { ietsMooisOpening, ietsMooisScenes } from "@/data/ietsMooisNarrative";
import { AlbumSignal } from "./AlbumWorld";
import "@/styles/iets-moois-narrative.css";

interface NarrativeProps {
  onOpenArtwork: (id: string, opener: HTMLButtonElement) => void;
}

function NarrativeArtwork({ id, onOpenArtwork, priority = false, paired = false }: NarrativeProps & { id: string; priority?: boolean; paired?: boolean }) {
  const image = albumVisualStory.find((item) => item.id === id)!;
  return <figure className="im-artwork">
    <button type="button" className="im-artwork__button" aria-haspopup="dialog"
      aria-label={`Bekijk beeld en ontwerp: ${image.title}`}
      onClick={(event) => onOpenArtwork(image.id, event.currentTarget)}>
      <img src={image.src} srcSet={`${image.thumbnail} 320w, ${image.src} ${image.width}w`}
        sizes={paired ? "(max-width: 640px) calc(100vw - 40px), (max-width: 1320px) 43vw, 580px" : "(max-width: 760px) calc(100vw - 40px), (max-width: 1320px) 45vw, 570px"}
        width={image.width} height={image.height} alt={image.alt}
        loading={priority ? "eager" : "lazy"} decoding="async" />
      <span className="im-artwork__action"><span><Expand size={16} aria-hidden="true" />Bekijk beeld en ontwerp</span><ArrowUpRight size={19} aria-hidden="true" /></span>
    </button>
    <figcaption><span>{image.title}</span><span>Beeldstudie</span></figcaption>
  </figure>;
}

/** The complete story is visible in normal document flow, including the server render. */
export default function IetsMooisNarrative({ onOpenArtwork }: NarrativeProps) {
  return <div className="im-narrative">
    <header className="im-opening" id={ietsMooisOpening.id} tabIndex={-1} aria-labelledby="im-story-title">
      <div className="im-opening__heading"><p className="ma-eyebrow">JOWIKROON / IETS MOOIS / Het verhaal</p>
        <h1 id="im-story-title">{ietsMooisOpening.title.map((line, index) => <span key={line}>{index > 0 && " "}{line}</span>)}</h1>
      </div>
      <NarrativeArtwork id={ietsMooisOpening.imageId} onOpenArtwork={onOpenArtwork} priority />
      <div className="im-opening__copy"><AlbumSignal /><p>{ietsMooisOpening.subtitle}</p>
        <a className="im-text-link" href="#album-toen">Volg het verhaal <ArrowDown size={18} aria-hidden="true" /></a>
      </div>
    </header>
    <nav className="im-story-index" id="album-spoor" aria-label="Hoofdstukken van het verhaal" tabIndex={-1}>
      <p className="ma-eyebrow">Van de belofte naar vandaag</p>
      <ol>{[ietsMooisOpening, ...ietsMooisScenes].map((scene, index) => <li key={scene.id}>
        <a href={`#${scene.id}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{scene.label}</a>
      </li>)}</ol>
    </nav>
    {ietsMooisScenes.map((scene, index) => <section key={scene.id} id={scene.id} tabIndex={-1}
      className={`im-scene im-scene--${scene.layout}`} aria-labelledby={`${scene.id}-title`}>
      <div className="im-scene__reading">
        <p className="im-scene__marker"><span>{String(index + 2).padStart(2, "0")}</span>{scene.label}</p>
        <h2 id={`${scene.id}-title`}>{scene.title}</h2>
        <p className="im-scene__text">{scene.text}</p>
        <div className="im-scene__echo" aria-hidden="true"><AlbumSignal /><span>{scene.word}</span></div>
      </div>
      <div className="im-scene__images">{scene.imageIds.map((id) => <NarrativeArtwork key={id} id={id} onOpenArtwork={onOpenArtwork} paired={scene.layout === "pair"} />)}</div>
    </section>)}
    <section className="im-story-invitation" aria-labelledby="im-invitation-title">
      <p className="ma-eyebrow">Het verhaal gaat verder bij jou</p>
      <h2 id="im-invitation-title">Wat je erin hoort,<br />mag van jou zijn.</h2>
      <a className="im-laser-link" href="#album-world">Ontdek alle beelden <span>15 beeldstudies</span><ArrowDown size={19} aria-hidden="true" /></a>
    </section>
  </div>;
}
