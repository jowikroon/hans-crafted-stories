import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { AlbumEditorial } from "@/data/albumEditorial";
import { AlbumSignal } from "./AlbumWorld";

type StorySteps = NonNullable<AlbumEditorial["trail"]>;

/** Optional perspectives on the story, independent of the album's track order. */
export default function AlbumStoryTrail({ steps }: { steps: StorySteps }) {
  const id = useId();
  const [selected, setSelected] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  function select(index: number, moveFocus = false) {
    setSelected(index);
    if (moveFocus) tabs.current[index]?.focus({ preventScroll: true });
  }

  function advance() {
    const next = (selected + 1) % steps.length;
    select(next, true);
    // The footer can sit below the tabs on a short screen. Reveal the new
    // reading position as well as moving keyboard focus to it.
    tabs.current[next]?.scrollIntoView({ block: "center", behavior: "instant" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = steps.length - 1;
    const next = event.key === "ArrowRight" ? (index + 1) % steps.length
      : event.key === "ArrowLeft" ? (index + last) % steps.length
      : event.key === "Home" ? 0 : event.key === "End" ? last : undefined;
    if (next === undefined) return;
    event.preventDefault();
    select(next, true);
  }

  return <section className="ma-story-trail" id="album-spoor" aria-labelledby={`${id}-heading`}>
    <div className="ma-section-heading">
      <div><p className="ma-eyebrow">Volg het spoor</p><h2 id={`${id}-heading`}>Van toen.<br />Naar hier.</h2></div>
      <p className="ma-section-heading__aside">Vier perspectieven op het verhaal. Begin waar je iets herkent.</p>
    </div>
    <div className="ma-story-trail__tabs" role="tablist" aria-label="Perspectieven op het verhaal">
      {steps.map((step, index) => <button type="button" role="tab" key={step.label}
        id={`${id}-tab-${index}`} aria-selected={selected === index} aria-controls={`${id}-panel-${index}`}
        tabIndex={selected === index ? 0 : -1} ref={(element) => { tabs.current[index] = element; }}
        onClick={() => select(index)} onKeyDown={(event) => onKeyDown(event, index)}>
        <span className="ma-story-trail__dot" aria-hidden="true" />{step.label}
      </button>)}
    </div>
    <div className="ma-story-trail__stage">
      {steps.map((step, index) => <div key={step.label} role="tabpanel" className="ma-story-trail__panel"
        id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={selected !== index} tabIndex={0}>
        <div className={`ma-story-trail__word ma-story-trail__word--${index}`} aria-hidden="true">
          <span>JOWIKROON / IETS MOOIS</span><strong>{step.word}</strong><AlbumSignal />
        </div>
        <div className="ma-story-trail__reading">
          <p className="ma-eyebrow">Het verhaal / {step.label}</p>
          <h3>{step.title}</h3><p>{step.text}</p><p className="ma-story-trail__detail">{step.detail}</p>
        </div>
      </div>)}
      <div className="ma-story-trail__footer">
        <span>Niet als antwoord, maar als spoor.</span>
        <button type="button" onClick={advance}>
          {selected === steps.length - 1 ? "Terug naar het begin" : `Verder: ${steps[selected + 1].label.toLowerCase()}`}
          <span aria-hidden="true">{selected === steps.length - 1 ? "↺" : "→"}</span>
        </button>
      </div>
    </div>
  </section>;
}
