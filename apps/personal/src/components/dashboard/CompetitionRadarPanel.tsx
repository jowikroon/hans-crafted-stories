import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CalendarRange, ExternalLink, Radio, ShieldAlert, Target } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import radarHistoryJson from "@/data/ccpCompetitionRadar.json";
import { filterRadarRuns, type RadarRun } from "@/lib/competitionRadar";

const radarHistory = radarHistoryJson as RadarRun[];
const competitors = [
  ["1", "Bosch", "Rem", "OEM-derived"], ["2", "ATE / Continental", "Rem", "Low-dust / Euro 7"],
  ["3", "TRW / ZF", "Rem, stuur", "OEM-derived"], ["4", "febi bilstein", "Alle kerncategorieën", "Directe multi-categorie-peer"],
  ["5", "Brembo", "Rem (premium)", "Greenance / low-dust"], ["6", "SKF", "Wiellager", "OEM-derived"],
  ["7", "FAG / Schaeffler", "Wiellager", "OEM-derived"], ["8", "Lemförder", "Stuur", "OEM-derived"],
  ["9", "Meyle", "Stuur, wiellager", "OE-equivalent"], ["10", "Frankberg / RIDEX", "Value-tier", "Marketplace-native"],
];

const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
const pdfUrl = (run: RadarRun) => `/cowork/ccp-ebay-de/${encodeURIComponent(run.sourceFile.replace(/\.md$/i, "-visual.pdf"))}`;

const Metric = ({ label, value, detail, tone = "ink" }: { label: string; value: string | number; detail: string; tone?: "ink" | "red" | "green" }) => {
  const toneClass = tone === "red" ? "text-[#C43B31]" : tone === "green" ? "text-[#2D9255]" : "text-[#15140F] dark:text-[#F5F1E6]";
  return <div className="rounded-xl border border-black/10 bg-[#FBF8F0] p-4 dark:border-white/10 dark:bg-white/5">
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7E7A6F]">{label}</p>
    <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p><p className="mt-1 text-xs text-[#7E7A6F]">{detail}</p>
  </div>;
};

const CompetitionRadarPanel = () => {
  const [start, setStart] = useState(radarHistory[0]?.run ?? "");
  const [end, setEnd] = useState(radarHistory.at(-1)?.run ?? "");
  const filtered = useMemo(() => filterRadarRuns(radarHistory, start, end), [start, end]);
  const first = filtered[0]; const latest = filtered.at(-1);
  const chooseStart = (value: string) => { setStart(value); if (value > end) setEnd(value); };
  const chooseEnd = (value: string) => { setEnd(value); if (value < start) setStart(value); };
  if (!latest || !first) return <p className="text-sm text-[#7E7A6F]">Geen radar-runs in deze periode.</p>;
  const euroDelta = latest.kpi.euro7Days - first.kpi.euro7Days;

  return <div className="space-y-5">
    <section className="relative overflow-hidden rounded-2xl bg-[#171812] px-5 py-6 text-[#F8F4E8] shadow-sm sm:px-7">
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-[#83A9FF]/30" />
      <div className="pointer-events-none absolute -right-9 -top-16 h-52 w-52 rounded-full border border-[#83A9FF]/20" />
      <div className="pointer-events-none absolute right-6 top-3 h-32 w-32 rounded-full border border-[#83A9FF]/10" />
      <div className="relative max-w-3xl">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9EB8F3]"><Radio size={14} /> CCP weekly intelligence</div>
        <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">Van marktsignaal naar besluit, over elke run.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#C7C5B9]">Amazon.de-remmen, stuurdelen en wiellagers. De tijdlijn wordt opgebouwd uit de wekelijkse Cowork-radarrapporten.</p>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#D6D2C4]">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Laatste run {formatDate(radarHistory.at(-1)!.run)}</span>
          <span className="rounded-full border border-[#D4902F]/30 bg-[#D4902F]/10 px-3 py-1.5 text-[#F2C071]">2 ontbrekende runs: 17 & 24 juni</span>
        </div>
      </div>
    </section>

    <section className="rounded-xl border border-black/10 bg-[#FBF8F0] p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#15140F] dark:text-[#F5F1E6]"><CalendarRange size={16} /> Periode vergelijken</div>
        <p className="mt-1 text-xs text-[#7E7A6F]">Alle KPI’s, trends en details volgen de gekozen start- en eindrun.</p>
      </div><div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7E7A6F]">Van
          <select aria-label="Startperiode" value={start} onChange={(event) => chooseStart(event.target.value)} className="mt-1 block w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#15140F] dark:border-white/10 dark:bg-[#20211B] dark:text-[#F5F1E6]">{radarHistory.map((run) => <option key={run.run} value={run.run}>{formatDate(run.run)}</option>)}</select>
        </label><ArrowRight className="mb-2 text-[#7E7A6F]" size={16} /><label className="text-[10px] font-semibold uppercase tracking-wider text-[#7E7A6F]">Tot
          <select aria-label="Eindperiode" value={end} onChange={(event) => chooseEnd(event.target.value)} className="mt-1 block w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#15140F] dark:border-white/10 dark:bg-[#20211B] dark:text-[#F5F1E6]">{radarHistory.map((run) => <option key={run.run} value={run.run}>{formatDate(run.run)}</option>)}</select>
        </label>
      </div></div>
    </section>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric label="Runs in periode" value={filtered.length} detail={`${formatDate(first.run)} → ${formatDate(latest.run)}`} />
      <Metric label="Euro 7 countdown" value={`${latest.kpi.euro7Days} d`} detail={`${euroDelta} dagen binnen periode`} tone="red" />
      <Metric label="AUTODOC B2B Q1" value={latest.kpi.autodocB2b ? `€${latest.kpi.autodocB2b}M` : "—"} detail="+39% YoY · PRO" tone="green" />
      <Metric label="Open aannames" value={latest.kpi.openQuestions} detail="incl. listing- en SOV-blinde vlekken" tone="red" />
    </div>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-black/10 bg-[#FBF8F0] p-4 dark:border-white/10 dark:bg-white/5">
        <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-[#15140F] dark:text-[#F5F1E6]">Euro 7 nadert</h3><p className="text-xs text-[#7E7A6F]">Dagen tot 29 november 2026</p></div><span className="rounded-full bg-[#C43B31]/10 px-2 py-1 text-[10px] font-semibold text-[#C43B31]">REGULATORY</span></div>
        <div className="h-52" aria-label="Euro 7 tijdlijn"><ResponsiveContainer width="100%" height="100%"><LineChart data={filtered} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D8D2C4" vertical={false} /><XAxis dataKey="run" tickFormatter={(v) => String(v).slice(5)} tick={{ fontSize: 11, fill: "#7E7A6F" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#7E7A6F" }} axisLine={false} tickLine={false} />
          <Tooltip labelFormatter={(v) => formatDate(String(v))} formatter={(v) => [`${v} dagen`, "Euro 7"]} contentStyle={{ borderRadius: 10, borderColor: "#D8D2C4", fontSize: 12 }} /><Line type="monotone" dataKey="kpi.euro7Days" stroke="#C43B31" strokeWidth={2.5} dot={{ r: 3, fill: "#FBF8F0", strokeWidth: 2 }} activeDot={{ r: 5 }} />
        </LineChart></ResponsiveContainer></div>
      </div>
      <div className="rounded-xl border border-black/10 bg-[#FBF8F0] p-4 dark:border-white/10 dark:bg-white/5">
        <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-[#15140F] dark:text-[#F5F1E6]">Onderzoeksdekking</h3><p className="text-xs text-[#7E7A6F]">Open vragen en aannames per run</p></div><span className="rounded-full bg-[#D4902F]/10 px-2 py-1 text-[10px] font-semibold text-[#A96912]">CONFIDENCE</span></div>
        <div className="h-52" aria-label="Open vragen tijdlijn"><ResponsiveContainer width="100%" height="100%"><LineChart data={filtered} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D8D2C4" vertical={false} /><XAxis dataKey="run" tickFormatter={(v) => String(v).slice(5)} tick={{ fontSize: 11, fill: "#7E7A6F" }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#7E7A6F" }} axisLine={false} tickLine={false} />
          <Tooltip labelFormatter={(v) => formatDate(String(v))} formatter={(v) => [v, "Open vragen"]} contentStyle={{ borderRadius: 10, borderColor: "#D8D2C4", fontSize: 12 }} /><Line type="stepAfter" dataKey="kpi.openQuestions" stroke="#D4902F" strokeWidth={2.5} dot={{ r: 3, fill: "#FBF8F0", strokeWidth: 2 }} activeDot={{ r: 5 }} />
        </LineChart></ResponsiveContainer></div>
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <div className="rounded-xl border border-black/10 bg-[#FBF8F0] p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2F65C8]">Run detail · {formatDate(latest.run)}</p><h3 className="mt-1 text-lg font-semibold text-[#15140F] dark:text-[#F5F1E6]">Wat staat er nu op de radar?</h3></div>
          <a href={pdfUrl(latest)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-[#15140F] hover:bg-[#E5DFCE] dark:border-white/10 dark:text-[#F5F1E6] dark:hover:bg-white/10">Visual PDF <ExternalLink size={12} /></a>
        </div><ol className="mt-5 space-y-4">{latest.summary.map((item, index) => <li key={item} className="grid grid-cols-[28px_1fr] gap-3 text-sm leading-6 text-[#4B4842] dark:text-[#C9BFB0]"><span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-[#2F65C8] text-[11px] font-semibold text-white">{index + 1}</span><span>{item}</span></li>)}</ol>
      </div>
      <div className="rounded-xl border border-black/10 bg-[#171812] p-5 text-[#F8F4E8]"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F2C071]"><Target size={14} /> Volgende acties</div><div className="mt-4 space-y-4">{latest.actions.slice(0, 4).map((action, index) => <div key={action.title} className="border-t border-white/10 pt-4 first:border-0 first:pt-0"><div className="flex gap-2 text-sm font-medium"><span className="text-[#83A9FF]">0{index + 1}</span><p>{action.title}</p></div>{action.detail && <p className="mt-1 pl-7 text-xs leading-5 text-[#AFAEA5]">{action.detail}</p>}</div>)}</div></div>
    </section>

    <section className="rounded-xl border border-black/10 bg-[#FBF8F0] p-4 dark:border-white/10 dark:bg-white/5"><div className="mb-3 flex items-center gap-2"><ShieldAlert size={16} className="text-[#C43B31]" /><h3 className="text-sm font-semibold text-[#15140F] dark:text-[#F5F1E6]">Veranderingen in geselecteerde eindrun</h3></div><div className="divide-y divide-black/[0.07] dark:divide-white/[0.07]">{latest.changes.map((change) => <div key={change.domain} className="grid gap-1 py-3 text-sm md:grid-cols-[180px_1fr] md:gap-4"><p className="font-medium text-[#15140F] dark:text-[#F5F1E6]">{change.domain}</p><div><p className="leading-5 text-[#4B4842] dark:text-[#C9BFB0]">{change.change}</p><p className="mt-1 text-[11px] text-[#7E7A6F]">Bron: {change.source}</p></div></div>)}</div></section>

    <section className="rounded-xl border border-black/10 bg-[#FBF8F0] dark:border-white/10 dark:bg-white/5"><div className="flex items-center justify-between px-4 py-3"><h3 className="text-sm font-semibold text-[#15140F] dark:text-[#F5F1E6]">Vaste competitor-set</h3><span className="text-[10px] uppercase tracking-wider text-[#7E7A6F]">composite top 10</span></div><div className="overflow-x-auto border-t border-black/[0.07] dark:border-white/[0.07]"><table className="w-full text-sm"><thead className="text-left text-[10px] uppercase tracking-wider text-[#7E7A6F]"><tr>{["#", "Concurrent", "Focus", "Signaal"].map((head) => <th key={head} className="px-4 py-2 font-semibold">{head}</th>)}</tr></thead><tbody>{competitors.map((row) => <tr key={row[0]} className={`border-t border-black/[0.06] dark:border-white/[0.06] ${row[0] === "4" ? "bg-[#2F65C8]/[0.06]" : ""}`}>{row.map((cell, index) => <td key={cell} className={`px-4 py-2.5 ${index === 1 ? "font-medium text-[#15140F] dark:text-[#F5F1E6]" : "text-[#5F5B53] dark:text-[#B8B2A7]"}`}>{cell}</td>)}</tr>)}</tbody></table></div></section>

    <div className="flex items-start gap-2 rounded-xl border border-[#D4902F]/25 bg-[#D4902F]/[0.06] p-4 text-xs leading-5 text-[#71501E] dark:text-[#F2C071]"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><p><strong>Datakwaliteit:</strong> Amazon.de listing-, prijs- en rankdata en Ahrefs SOV ontbreken nog. De radar toont dit als blinde vlek en presenteert onbevestigde aannames niet als feit.</p></div>
  </div>;
};

export default CompetitionRadarPanel;
