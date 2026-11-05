import { useId, useState } from "react";
import type { Song } from "@/data/music";
import { recordingNotes, songProduction, type ProductionVersion, type SongProduction } from "@/data/songProduction";
import { HangingOnProcess } from "@/components/HangingOnProcess";
import "@/styles/song-production.css";

type Meter = { key: string; title: string; unit: string; description: string; min: number; max: number; value: (version: ProductionVersion) => number | undefined };
const meters: Meter[] = [
  { key: "loudness", title: "Overall loudness", unit: "LUFS", description: "The measured average across the full recording. Values closer to zero are louder.", min: -24, max: 0, value: (v) => v.integratedLufs },
  { key: "true-peak", title: "True peak", unit: "dBTP", description: "The estimated highest reconstructed peak. Zero marks digital full scale.", min: -8, max: 2, value: (v) => v.truePeakDbtp },
  { key: "range", title: "Loudness range", unit: "LU", description: "How widely the recording’s loudness varies over time.", min: 0, max: 12, value: (v) => v.loudnessRangeLu },
  { key: "peak-distance", title: "Peak-to-loudness distance", unit: "dB", description: "True peak minus overall loudness. This is different from short-window crest and loudness range.", min: 0, max: 16, value: (v) => v.truePeakDbtp - v.integratedLufs },
];

const number = (n: number, digits = 1) => n.toFixed(digits).replace("-", "−");
const readingDigits = (version: ProductionVersion) => version.provenance === "Neural Analog Studio" ? 1 : 2;
const formatDate = (date: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

function MetricFigure({ meter, versions, id }: { meter: Meter; versions: ProductionVersion[]; id: string }) {
  const values = versions.flatMap((version) => { const value = meter.value(version); return value === undefined ? [] : [{ version, value }]; });
  if (!values.length) return null;
  const lo = Math.min(meter.min, Math.floor(Math.min(...values.map((v) => v.value)) / 4) * 4);
  const hi = Math.max(meter.max, Math.ceil(Math.max(...values.map((v) => v.value)) / 2) * 2);
  const position = (value: number) => `${(value - lo) / (hi - lo) * 100}%`;
  const ticks = [lo, lo + (hi - lo) / 2, hi];
  return <figure className="sp-meter" aria-labelledby={`${id}-title`}>
    <div className="sp-meter__heading"><h4 id={`${id}-title`}>{meter.title}</h4><span>{meter.unit}</span></div>
    <p className="sp-meter__description">{meter.description}</p>
    <div className="sp-meter__plot" role="img" aria-label={`${meter.title}. ${values.map(({ version, value }) => `${version.label}: ${value.toFixed(readingDigits(version))} ${meter.unit}`).join(". ")}`}>
      <div aria-hidden="true">
        {values.map(({ version, value }) => <div className="sp-meter__row" key={version.key}>
          <div className="sp-meter__label"><span>{version.label}</span><strong>{number(value, readingDigits(version))}</strong></div>
          <div className="sp-meter__track"><span className="sp-meter__fill" style={{ width: position(value) }}/><span className="sp-meter__point" style={{ left: position(value) }}/>{meter.key === "true-peak" && <span className="sp-meter__zero" style={{ left: position(0) }}/>}</div>
        </div>)}
        <div className="sp-meter__axis">{ticks.map((tick) => <span key={tick}>{number(tick, 0)}</span>)}</div>
      </div>
    </div>
    <figcaption>{meter.key === "peak-distance" ? "Calculated from the two measured values." : meter.key === "true-peak" ? "Blue marker: 0 dBTP, digital full scale." : "Readings for the named versions."}</figcaption>
  </figure>;
}

function VersionTable({ data }: { data: SongProduction }) {
  return <details className="ho-method sp-version-details">
    <summary>Versions &amp; measurement notes</summary>
    <div className="sp-table-scroll" tabIndex={0} role="region" aria-label="Version measurements. Scroll horizontally on small screens.">
      <table className="sp-table"><caption>Measured readings and calculated peak distance for each version</caption><thead><tr><th scope="col">Version</th><th scope="col">LUFS</th><th scope="col">True peak</th><th scope="col">Range</th><th scope="col">Peak distance</th><th scope="col">File format</th></tr></thead>
        <tbody>{data.versions.map((version) => <tr key={version.key}><th scope="row">{version.label}<small>{version.provenance} · {formatDate(version.measuredOn)}</small></th><td>{number(version.integratedLufs, readingDigits(version))}</td><td>{number(version.truePeakDbtp, readingDigits(version))} dBTP</td><td>{version.loudnessRangeLu === undefined ? "Not recorded" : `${number(version.loudnessRangeLu, readingDigits(version))} LU`}</td><td>{number(version.truePeakDbtp - version.integratedLufs, readingDigits(version))} dB</td><td>{[version.sampleRateHz === undefined ? null : `${version.sampleRateHz / 1000} kHz`, version.bitDepth === undefined ? null : `${version.bitDepth}-bit`, version.channels].filter(Boolean).join(" · ") || "Not recorded"}</td></tr>)}</tbody>
      </table>
    </div>
    {data.method.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
  </details>;
}

function VersionComparison({ versions, id }: { versions: ProductionVersion[]; id: string }) {
  const [[referenceKey, comparedKey], setPair] = useState([versions[0].key, versions[1].key]);
  const reference = versions.find((version) => version.key === referenceKey)!;
  const compared = versions.find((version) => version.key === comparedKey)!;
  // A difference must not imply more precision than either of its input readings.
  const digits = Math.min(readingDigits(reference), readingDigits(compared));
  const differences = meters.flatMap((meter) => {
    const from = meter.value(reference);
    const to = meter.value(compared);
    if (from === undefined || to === undefined) return [];
    const value = Number((to - from).toFixed(digits));
    return [{ key: meter.key, title: meter.title, value, unit: meter.key === "loudness" ? "LU" : meter.key === "true-peak" ? "dB" : meter.unit }];
  });
  return <section className="sp-comparison" aria-labelledby={`${id}-comparison-title`}>
    <div className="sp-comparison__heading"><h4 id={`${id}-comparison-title`}>Compare two versions.</h4><p id={`${id}-comparison-help`}>Choose a reference and another saved version. Each difference is the compared version minus the reference, calculated from the displayed readings.</p></div>
    <div className="sp-comparison__controls">
      <div><label htmlFor={`${id}-reference`}>Reference version</label><select id={`${id}-reference`} value={referenceKey} aria-describedby={`${id}-comparison-help`} aria-controls={`${id}-differences`} onChange={(event) => setPair([event.target.value, comparedKey])}>{versions.map((version) => <option key={version.key} value={version.key} disabled={version.key === comparedKey}>{version.label}</option>)}</select></div>
      <div><label htmlFor={`${id}-compared`}>Compared version</label><select id={`${id}-compared`} value={comparedKey} aria-describedby={`${id}-comparison-help`} aria-controls={`${id}-differences`} onChange={(event) => setPair([referenceKey, event.target.value])}>{versions.map((version) => <option key={version.key} value={version.key} disabled={version.key === referenceKey}>{version.label}</option>)}</select></div>
      <button className="sp-comparison__swap" type="button" onClick={() => setPair([comparedKey, referenceKey])} aria-controls={`${id}-differences`}>Swap versions <span aria-hidden="true">↔</span></button>
    </div>
    <div id={`${id}-differences`} role="status" aria-live="polite" aria-atomic="true">
      <p className="sp-comparison__pair"><strong>{compared.label}</strong> compared with <strong>{reference.label}</strong></p>
      <dl className="sp-differences">{differences.map((difference) => <div key={difference.key}><dt>{difference.title}</dt><dd><span>{difference.value > 0 ? "+" : ""}{number(difference.value, digits)}</span> <small>{difference.unit}</small></dd></div>)}</dl>
    </div>
    <p className="sp-comparison__note">Positive means a higher reading; negative means a lower reading. Peak distance is true peak minus overall loudness. These differences describe the named versions, without rating their sound.</p>
  </section>;
}

function SavedProcessing({ versions }: { versions: ProductionVersion[] }) {
  const processed = versions.filter((version) => version.processing !== undefined);
  if (!processed.length) return null;
  return <details className="ho-method sp-processing">
    <summary>Saved processing settings</summary>
    <p>Each entry names the input and settings recorded for that saved version. Separate entries may belong to different branches of the session.</p>
    <ul className="sp-processing__list">{processed.map((version) => {
      const processing = version.processing!;
      return <li key={version.key}><h4>{version.label}</h4><p>{processing.operation}</p><dl><div><dt>Source version</dt><dd>{processing.sourceVersion}</dd></div><div><dt>Saved</dt><dd><time dateTime={processing.savedOn}>{formatDate(processing.savedOn)}</time></dd></div></dl><ul>{processing.settings.map((setting) => <li key={setting}>{setting}</li>)}</ul></li>;
    })}</ul>
  </details>;
}

export function ProductionMetrics({ data, id }: { data: SongProduction; id: string }) {
  const hasRange = data.versions.some((v) => v.loudnessRangeLu !== undefined);
  const selectedMeters = meters.filter((meter) => hasRange || meter.key !== "range");
  return <div className="sp-measurements">
    <div className="sp-measurements__heading"><p className="ho-eyebrow">Measured versions</p><h3>The recording, in numbers.</h3><p>{data.scope}</p></div>
    <div className={`sp-meters${selectedMeters.length === 4 ? " sp-meters--four" : ""}`}>{selectedMeters.map((meter) => <MetricFigure key={meter.key} meter={meter} versions={data.versions} id={`${id}-${meter.key}`}/>)}</div>
    {data.versions.length > 1 && <VersionComparison key={data.title} versions={data.versions} id={id}/>}
    <SavedProcessing versions={data.versions}/>
    <VersionTable data={data}/>
  </div>;
}

function ProcessSteps({ data }: { data: SongProduction }) {
  return <ol className="sp-process-steps" aria-label="Inside the session">{data.steps.map((step, index) => <li key={step.title}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>;
}

export function SongProductionProcess({ song, sectionId = "song-process" }: { song: Song; sectionId?: string }) {
  const id = `production-${useId().replace(/:/g, "")}`;
  const data = songProduction[song.slug] ?? recordingNotes(song.title, song.duration, song.provider);
  if (song.slug === "hanging-on") return <HangingOnProcess sectionId={sectionId}><ProductionMetrics data={data} id={id}/><ProcessSteps data={data}/></HangingOnProcess>;
  return <section className="ho-process" id={sectionId} aria-labelledby={`${id}-title`}>
    <header className="ho-process__intro"><p className="ho-eyebrow">Inside the recording</p><h2 id={`${id}-title`}>{data.title}</h2><p>{data.intro}</p></header>
    <ProcessSteps data={data}/>
    {data.versions.length ? <ProductionMetrics data={data} id={id}/> : <p className="sp-evidence-note">{data.scope}</p>}
  </section>;
}
