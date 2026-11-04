import { useId, type ReactNode } from "react";
import data from "@/data/hangingOnAnalysis.json";
import { hangingOnStory as story } from "@/data/hangingOnStory";

const violet = "var(--ho-violet)";
const ice = "var(--ho-ice)";
const time = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Timeline({ peaks = false, prefix }: { peaks?: boolean; prefix: string }) {
  const id = `${prefix}-${peaks ? "peaks" : "shape"}`;
  const lo = peaks ? 0 : -64;
  const hi = peaks ? 18 : -12;
  const ticks = peaks ? [0, 4, 8, 12, 16] : [-60, -48, -36, -24, -12];
  const y = (v: number) => 250 - ((v - lo) / (hi - lo)) * 210;
  const line = (values: number[][]) => values.map((p, i) => `${i ? "L" : "M"}${(65 + p[0] / 480 * 805).toFixed(1)},${y(p[peaks ? 2 : 1]).toFixed(1)}`).join(" ");
  return <svg viewBox="0 0 900 300" role="img" aria-labelledby={`ho-${id}-title`} aria-describedby={`ho-${id}-desc`}>
    <title id={`ho-${id}-title`}>{peaks ? "Short-term peak space" : "Level through the recording"}</title>
    <desc id={`ho-${id}-desc`}>{peaks ? "The earlier source generally has more peak-to-average distance. Each point is the median of ten 100 millisecond crest measurements." : "The two full-mix level traces closely follow one another after overall loudness matching. Each point averages ten 100 millisecond RMS values in decibels."} Solid violet: existing master. Dashed blue: earlier source. Time runs from zero to eight minutes.</desc>
    <text x="65" y="20" fill="currentColor" fontSize="12">{peaks ? "Peak-to-average distance · dB" : "Mean RMS level · dBFS · both at −18 LUFS"}</text>
    {ticks.map(t => <g key={t}><line x1="65" x2="870" y1={y(t)} y2={y(t)} stroke="currentColor" opacity=".14"/><text x="52" y={y(t)+4} textAnchor="end" fill="currentColor" fontSize="12">{t}</text></g>)}
    {[0,60,120,180,240,300,360,420,480].map(t => <text key={t} x={65+t/480*805} y="278" textAnchor="middle" fill="currentColor" fontSize="12">{time(t)}</text>)}
    <path d={line(data.series.master)} stroke={violet} strokeWidth="1.6" fill="none"/>
    <path d={line(data.series.source)} stroke={ice} strokeWidth="1.5" strokeDasharray="5 3" fill="none"/>
  </svg>;
}

function Balance({ prefix }: { prefix: string }) {
  const x = (v: number) => 155 + (v + 2) / 3 * 260;
  return <svg className="ho-balance" viewBox="0 0 480 350" role="img" aria-labelledby={`${prefix}-balance-title`} aria-describedby={`${prefix}-balance-desc`}>
    <title id={`${prefix}-balance-title`}>Frequency balance at matched loudness</title>
    <desc id={`${prefix}-balance-desc`}>Existing master minus earlier source, in decibels. Low bands are modestly higher; mid and high bands are lower. {data.bands.map(b => `${b.hz} Hz: ${b.deltaDb>0 ? "+" : ""}${b.deltaDb.toFixed(2)} dB.`).join(" ")}</desc>
    <text x="12" y="22" fill="currentColor" fontSize="15">Frequency · Hz (k = 1,000)</text>
    {[-2,-1,0,1].map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1="38" y2="301" stroke="currentColor" opacity={t===0 ? .5 : .14}/><text x={x(t)} y="325" textAnchor="middle" fill="currentColor" fontSize="12">{t>0 ? "+" : ""}{t} dB</text></g>)}
    {data.bands.map((b,i) => <g key={b.hz}>
      <text x="115" y={58+i*33} textAnchor="end" fill="currentColor" fontSize="15">{b.hz.split("-").map(v => Number(v)>=1000 ? `${Number(v)/1000}k` : v).join("–")}</text>
      <rect x={Math.min(x(0),x(b.deltaDb))} y={43+i*33} width={Math.abs(x(b.deltaDb)-x(0))} height="22" rx="3" fill={b.deltaDb>=0 ? violet : ice}/>
      <text x={b.deltaDb>=0 ? x(b.deltaDb)+7 : x(b.deltaDb)-7} y={58+i*33} textAnchor={b.deltaDb>=0 ? "start" : "end"} fill="currentColor" fontSize="15">{b.deltaDb>0 ? "+" : ""}{b.deltaDb.toFixed(2)}</text>
    </g>)}
  </svg>;
}

export function HangingOnProcess({ sectionId = "song-process", children }: { sectionId?: string; children?: ReactNode } = {}) {
  const prefix = `hanging-${useId().replace(/:/g, "")}`;
  const titles = ["The full recording, at equal loudness", "The space around short peaks", "Where the balance shifts"];
  const descriptions = ["Existing master and earlier source · 7:59 recording", "Median peak-to-average distance · one-second view", "Existing master minus earlier source · equal overall loudness"];
  return <section className="ho-process" id={sectionId} aria-labelledby={`${prefix}-process-title`}>
    <header className="ho-process__intro"><p className="ho-eyebrow">{story.eyebrow}</p><h2 id={`${prefix}-process-title`}>{story.title}</h2><p>{story.intro}</p></header>
    {story.chapters.map((chapter,i) => <section className="ho-chapter" key={chapter.id} aria-labelledby={`${prefix}-chapter-${chapter.id}`}>
      <div className="ho-chapter__heading"><span className="ho-chapter__number" aria-hidden="true">0{i+1}</span><div><h3 id={`${prefix}-chapter-${chapter.id}`}>{chapter.title}</h3><p>{chapter.body}</p></div></div>
      <figure className="ho-figure">
        <div className="ho-figure__heading"><h4>{titles[i]}</h4><p>{descriptions[i]}</p></div>
        <div className="ho-chart" tabIndex={0} role="region" aria-label={`${titles[i]}. Scroll horizontally on small screens.`}>{i===2 ? <Balance prefix={prefix}/> : <Timeline peaks={i===1} prefix={prefix}/>}</div>
        {i<2 && <p className="ho-scroll-hint" aria-hidden="true">Swipe to explore the full recording →</p>}
        {i<2 && <div className="ho-legend"><span className="ho-legend__master"><i aria-hidden="true"/>Existing master</span><span className="ho-legend__source"><i aria-hidden="true"/>Earlier source</span></div>}
        <figcaption>{chapter.caption}</figcaption>
      </figure>
    </section>)}
    <p className="ho-closing">{story.closing}</p>
    {children}
    <details className="ho-method"><summary>{story.method.title}</summary>{story.method.paragraphs.map(p => <p key={p}>{p}</p>)}<p>Timeline method: {data.aggregation} Frequency differences compare total band energy after loudness matching; they are not an EQ prescription.</p></details>
  </section>;
}
