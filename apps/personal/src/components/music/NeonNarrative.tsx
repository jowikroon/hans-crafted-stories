import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "@/components/LocalizedLink";
import { neonCipher, neonEpilogue, neonScenes, type NeonScene } from "@/data/neonNarrative";
import { AlbumSignal } from "./AlbumWorld";
import "@/styles/neon-narrative.css";

function SceneArt({ scene }: { scene: NeonScene }) {
  return <figure className={`nn-art nn-art--${scene.visual}`} role="img" aria-label={scene.visualAlt}>
    {scene.visual === "pulse" && <><span /><span /><span /><i /></>}
    {scene.visual === "glass" && <><span /><span /><span /><i /></>}
    {scene.visual === "pressure" && [26, 41, 72, 53, 87, 58, 98, 67, 35, 56, 24].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
    {scene.visual === "doors" && Array.from({ length: 7 }, (_, index) => <span key={index} />)}
    {scene.visual === "slit" && <span />}
    {scene.visual === "then" && <><span><strong>TOEN</strong><small>één mens / vroeger</small></span><span><strong>NU</strong><small>één mens / vandaag</small></span></>}
    {scene.visual === "between" && <><span /><span /></>}
  </figure>;
}

/** Every chapter is a native anchor target and part of the normal server-rendered page. */
export default function NeonNarrative() {
  const chapters = [...neonScenes.map(({ id, label }) => ({ id, label })), { id: neonEpilogue.id, label: neonEpilogue.label }, { id: neonCipher.id, label: neonCipher.label }];
  return <div className="nn-story">
    <header className="nn-opening" id="album-origin" tabIndex={-1} aria-labelledby="nn-title">
      <div className="nn-opening__copy">
        <p className="ma-eyebrow">JOWIKROON / NEON: THE SIGNAL BETWEEN / HET VERHAAL</p>
        <h1 id="nn-title">Er is verschil tussen licht geven <span>en gezien worden.</span></h1>
        <p>In de stad brandt altijd wel iets. Schermen, plannen, verwachtingen, muziek. Ik kan er middenin staan en toch voelen dat er afstand is. NEON is geen verhaal waarin ineens alles goedkomt. Het is een beweging van blijven zoeken en beter leren luisteren.</p>
        <a href="#neon-scene-1" className="nn-text-link">Volg het signaal <ArrowDown size={18} aria-hidden="true" /></a>
      </div>
      <figure className="nn-opening__cover">
        <img src="/images/albums/neon-front.webp" width={1254} height={1254} alt="Bestaande albumcover van NEON: The Signal Between, met twee handen en een klein violet signaal" decoding="async" />
        <figcaption>Een hand. Een antwoord zonder woorden.</figcaption>
      </figure>
    </header>

    <nav className="nn-chapters" id="album-spoor" tabIndex={-1} aria-label="Negen scènes van het verhaal">
      <div><p className="ma-eyebrow">Kies je eigen tempo</p><p>Een verhaal in negen momenten. Je mag bij ieder moment beginnen.</p></div>
      <ol>{chapters.map(({ id, label }, index) => <li key={id}><a href={`#${id}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{label}</a></li>)}</ol>
      <p className="nn-chapters__note">Onderweg komen verlies en heftige gevoelens ter sprake. Neem de ruimte die je nodig hebt.</p>
    </nav>

    {neonScenes.map((scene, index) => <section key={scene.id} id={scene.id} tabIndex={-1}
      className={`nn-scene${index % 2 ? " nn-scene--reverse" : ""}`} aria-labelledby={`${scene.id}-title`}>
      <div className="nn-scene__copy">
        <p className="nn-scene__marker"><span>{String(index + 1).padStart(2, "0")}</span>{scene.marker}</p>
        <h2 id={`${scene.id}-title`}>{scene.title}</h2>
        <div className="nn-scene__body">{scene.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        {scene.musicalEcho && <p className="nn-scene__echo"><AlbumSignal /><span>Muzikale echo · {scene.musicalEcho}</span></p>}
      </div>
      <SceneArt scene={scene} />
    </section>)}

    <section id={neonEpilogue.id} className="nn-dawn" tabIndex={-1} aria-labelledby="nn-dawn-title">
      <div className="nn-dawn__copy"><p className="nn-scene__marker"><span>08</span>{neonEpilogue.marker}</p><h2 id="nn-dawn-title">{neonEpilogue.title}</h2>
        {neonEpilogue.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div><div className="nn-dawn__horizon" aria-hidden="true" />
    </section>

    <section id={neonCipher.id} className="nn-cipher" tabIndex={-1} aria-labelledby="nn-cipher-title">
      <p className="nn-scene__marker"><span>09</span>Twee albums, één verhaal</p>
      <h2 id="nn-cipher-title">{neonCipher.title}</h2>
      <p className="nn-cipher__lead">Er loopt een kleine code door de muziek. Drie delen worden vier letters, en ineens krijgt de verbinding een naam.</p>
      <div className="nn-cipher__plate" role="group" aria-label="N is 1. E is 2. Drie is ON. Samen spellen ze NEON.">
        <p className="nn-cipher__eyebrow">JOWIKROON · TWEE ALBUMS, ÉÉN VERHAAL</p>
        <div className="nn-cipher__grid">{[
          { index: "01", letter: "N", equation: "N = 1" },
          { index: "02", letter: "E", equation: "E = 2" },
          { index: "03", letter: "ON", equation: "3 = ON" },
        ].map(({ index, letter, equation }) => <div className="nn-cipher__card" key={letter}><span>{index}</span><strong>{letter}</strong><small>{equation}</small></div>)}</div>
        <span className="nn-cipher__arrow" aria-hidden="true">↓</span>
        <p className="nn-cipher__answer">NEON</p>
        <p className="nn-cipher__meaning">ON betekent dat er weer iets aangaat. Niet alle lampen tegelijk. Kamer voor kamer, op mijn eigen tempo.</p>
        <p className="nn-cipher__disclaimer">Verhalende code, geen definitieve volgorde van de nummers.</p>
      </div>
    </section>

    <section className="nn-bridge" aria-labelledby="nn-bridge-title">
      <div><p className="ma-eyebrow">De verbinding / IETS MOOIS × NEON</p><h2 id="nn-bridge-title">Hetzelfde verhaal.<br />Een andere taal.</h2>
        <p>IETS MOOIS geeft woorden aan wat vanbinnen leeft. NEON laat de beweging horen: tussen toen en nu, mezelf en de ander, schaduw en licht.</p>
        <p>Het ene album legt het andere niet uit. Samen laten ze meer zien.</p>
      </div>
      <blockquote className="nn-bridge__quote"><p className="ma-eyebrow">De woorden die terugkeren</p>
        <p>“Maak er iets moois van.”</p>
        <span>Voor mij zit de kracht in <em>maak</em>. Ik heb niet alle gevoelens in de hand. Maar wat ik ermee doe en aan wie ik aandacht geef, daarin kan ik iets kiezen.</span>
        <Link to="/music/albums/iets-moois/brand" className="nn-text-link">Lees het verhaal van IETS MOOIS <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </blockquote>
    </section>
  </div>;
}
