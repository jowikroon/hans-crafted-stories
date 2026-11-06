import { ArrowDown, ArrowUpRight, Expand } from "lucide-react";
import { Link } from "@/components/LocalizedLink";
import { albumVisualStory } from "@/data/albumVisualStory";
import { ietsMooisCode, ietsMooisOpening, ietsMooisScenes } from "@/data/ietsMooisNarrative";
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
        <blockquote className="im-opening__quote">“{ietsMooisOpening.quote}”</blockquote>
        <p className="im-opening__attribution">{ietsMooisOpening.attribution}</p>
      </div>
      <NarrativeArtwork id={ietsMooisOpening.imageId} onOpenArtwork={onOpenArtwork} priority />
      <div className="im-opening__copy"><AlbumSignal /><p>{ietsMooisOpening.subtitle}</p>
        <a className="im-text-link" href="#album-toen">Volg het verhaal <ArrowDown size={18} aria-hidden="true" /></a>
      </div>
    </header>
    <nav className="im-story-index" id="album-spoor" aria-label="Hoofdstukken van het verhaal" tabIndex={-1}>
      <p className="ma-eyebrow">Van vijf woorden naar NEON</p>
      <ol>{[ietsMooisOpening, ...ietsMooisScenes, ietsMooisCode].map((scene, index) => <li key={scene.id}>
        <a href={`#${scene.id}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{scene.label}</a>
      </li>)}</ol>
    </nav>
    {ietsMooisScenes.map((scene, index) => <section key={scene.id} id={scene.id} tabIndex={-1}
      className={`im-scene im-scene--${scene.layout}`} aria-labelledby={`${scene.id}-title`}>
      <div className="im-scene__reading">
        <p className="im-scene__marker"><span>{String(index + 2).padStart(2, "0")}</span>{scene.label}</p>
        <h2 id={`${scene.id}-title`}>{scene.title}</h2>
        <div className="im-scene__body">{scene.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        <div className="im-scene__echo" aria-hidden="true"><AlbumSignal /><span>{scene.word}</span></div>
      </div>
      <div className="im-scene__images">
        {scene.id === "album-stilte" && <div className="im-door-art" aria-hidden="true">{Array.from({ length: 7 }, (_, door) => <span key={door} />)}</div>}
        {scene.layout === "quiet" && <div className="im-light-slit" aria-hidden="true" />}
        {scene.imageIds.map((id) => <NarrativeArtwork key={id} id={id} onOpenArtwork={onOpenArtwork} paired={scene.layout === "pair"} />)}
      </div>
    </section>)}
    <section className="im-cipher" id={ietsMooisCode.id} tabIndex={-1} aria-labelledby="im-code-title">
      <p className="im-scene__marker"><span>08</span>{ietsMooisCode.label}</p>
      <h2 id="im-code-title">{ietsMooisCode.title}</h2>
      <p className="im-cipher__lead">Er loopt een kleine code door de muziek. Drie delen. Vier letters. Eén verbinding.</p>
      <div className="im-cipher__plate" aria-label="N is 1. E is 2. 3 is ON. Samen vormen deze letters NEON.">
        <p className="im-cipher__eyebrow">JOWIKROON · TWEE ALBUMS, ÉÉN VERHAAL</p>
        <div className="im-cipher__grid">
          {[{ number: "01", letter: "N", equation: "N = 1" }, { number: "02", letter: "E", equation: "E = 2" }, { number: "03", letter: "ON", equation: "3 = ON" }].map((part) => <div className="im-cipher__card" key={part.letter}>
            <span>{part.number}</span><strong>{part.letter}</strong><span>{part.equation}</span>
          </div>)}
        </div>
        <span className="im-cipher__arrow" aria-hidden="true">↓</span>
        <p className="im-cipher__answer">NEON</p>
        <p className="im-cipher__caption">Drie delen. Vier letters. Eén verbinding.</p>
      </div>
      <div className="im-cipher__meaning"><p>{ietsMooisCode.note}</p><p>{ietsMooisCode.explanation}</p></div>
    </section>
    <section className="im-album-bridge" aria-labelledby="im-bridge-title">
      <p className="im-scene__marker"><span>09</span>Twee werelden, één mens</p>
      <h2 id="im-bridge-title">Hetzelfde verhaal.<br />Een andere taal.</h2>
      <p className="im-album-bridge__lead">In IETS MOOIS zoek ik de Nederlandse woorden dichtbij. In NEON krijgt wat weer aangaat ritme, nacht en beweging.</p>
      <div className="im-album-bridge__albums">
        <article><img src="/images/albums/iets-moois-front.webp" alt="Bestaande albumillustratie IETS MOOIS van Jowikroon" width={1254} height={1254} loading="lazy" decoding="async" /><div><p>IETS MOOIS · NEDERLANDS</p><h3>Dichter bij de woorden.</h3><Link to="/music/albums/iets-moois#album-tracks">Luister naar IETS MOOIS <ArrowUpRight size={17} aria-hidden="true" /></Link></div></article>
        <article><img src="/images/albums/neon-front.webp" alt="Bestaande albumillustratie NEON: The Signal Between van Jowikroon" width={1254} height={1254} loading="lazy" decoding="async" /><div><p>NEON · ELEKTRONISCH</p><h3>Het signaal door de nacht.</h3><Link to="/music/albums/neon-the-signal-between">Ontdek NEON <ArrowUpRight size={17} aria-hidden="true" /></Link></div></article>
      </div>
    </section>
    <section className="im-story-invitation" aria-labelledby="im-invitation-title">
      <p className="ma-eyebrow">Geen einde. Een begin.</p>
      <h2 id="im-invitation-title">En ik ben<br />ermee bezig.</h2>
      <p>Mijn opa gaf me geen handleiding voor het leven. Hij gaf me vijf woorden, en vooral één werkwoord. Ik ben er nog niet. Dat hoeft ook niet.</p>
      <a className="im-laser-link" href="#album-world">Ontdek alle beelden <span>15 beeldstudies</span><ArrowDown size={19} aria-hidden="true" /></a>
    </section>
  </div>;
}
