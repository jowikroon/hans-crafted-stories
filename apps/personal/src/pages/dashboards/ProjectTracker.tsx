import { Fragment } from "react";

export interface TrackerSnapshot {
  available: boolean;
  reason?: string;
  page_url?: string;
  source_updated_at?: string;
  synced_at?: string;
  stale?: boolean;
  sections?: { id: string; markdown: string }[];
}

function Inline({ text }: { text: string }) {
  // Render only text, bold and safe source links. Never interpret stored HTML.
  const pieces = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https:\/\/[^\s)]+\))/g);
  return <>{pieces.map((piece, i) => {
    if (piece.startsWith("**") && piece.endsWith("**")) return <strong key={i}>{piece.slice(2, -2)}</strong>;
    const link = piece.match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/);
    return link ? <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{link[1]}</a> : <Fragment key={i}>{piece}</Fragment>;
  })}</>;
}

const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, "|"));

function Block({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n").filter(line => line.trim());
  if (lines.length > 1 && lines[0].trim().startsWith("|") && /^\|?\s*:?-+/.test(lines[1])) {
    const titles = cells(lines[0]);
    return <div className="overflow-x-auto rounded-xl border border-[#E5DFCE]">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#F2EFE4]"><tr>{titles.map((title, i) => <th key={i} className="p-3 font-semibold"><Inline text={title} /></th>)}</tr></thead>
        <tbody>{lines.slice(2).map((line, i) => <tr key={i} className="border-t border-[#E5DFCE]">{cells(line).map((cell, j) => <td key={j} className="min-w-32 p-3 align-top leading-relaxed"><Inline text={cell} /></td>)}</tr>)}</tbody>
      </table>
    </div>;
  }
  return <>{lines.map((line, i) => {
    const title = line.match(/^#{1,6}\s+(.+)/);
    if (title) return <h3 key={i} className="mt-5 mb-2 text-sm font-semibold"><Inline text={title[1]} /></h3>;
    const item = line.match(/^[-*]\s+(?:\[([ xX])\]\s+)?(.*)/);
    return item ? <p key={i} className="my-2 text-sm leading-relaxed">{item[1] !== undefined ? (item[1].toLowerCase() === "x" ? "☑ " : "☐ ") : "• "}<Inline text={item[2]} /></p> : <p key={i} className="my-2 text-sm leading-relaxed"><Inline text={line} /></p>;
  })}</>;
}

export default function ProjectTracker({ tracker }: { tracker?: TrackerSnapshot }) {
  const date = (value?: string) => value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" }) : "onbekend";
  return <section aria-label="Projecttracker" className="mt-6 text-[#4A4740]">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold text-[#15140F]">Projecttracker</h2>
      {tracker?.available && <a className="text-xs underline" href={tracker.page_url} target="_blank" rel="noopener noreferrer">Open tracker</a>}
    </div>
    {!tracker?.available ? <p role="status" className="mt-2 text-sm text-[#7E7A6F]">{tracker?.reason ?? "Tracker is nog niet gesynchroniseerd."}</p> : <>
      <p className="mt-1 text-[11px] text-[#7E7A6F]">Gesynchroniseerd {date(tracker.synced_at)} · bron gewijzigd {date(tracker.source_updated_at)}</p>
      {tracker.stale && <p role="status" className="mt-3 rounded-xl bg-[#FBF1EF] p-3 text-sm text-[#B4483C]">De laatste synchronisatie is ouder dan 36 uur. Deze informatie kan achterlopen.</p>}
      {(tracker.sections ?? []).map(section => <Block key={section.id} markdown={section.markdown} />)}
    </>}
  </section>;
}
