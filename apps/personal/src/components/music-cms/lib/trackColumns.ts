// Kolomdefinities voor het productie-dashboard. Elke kolom weet zelf welke
// sorteerrichting logisch is als je 'm voor het eerst aanklikt:
//  - tekst  -> A→Z
//  - getal/datum -> hoog→laag (lang naar kort, groot naar klein, nieuw naar oud)
import type { Track } from "./trackStore";

export type ColumnKind = "text" | "number" | "date";

export interface ColumnDef {
  id: string;
  label: string;
  short: string;
  kind: ColumnKind;
  /** standaardrichting bij de eerste klik */
  defaultDir: "asc" | "desc";
  /** uitleg van beide richtingen, voor de tooltip */
  ascLabel: string;
  descLabel: string;
  value: (t: Track) => string | number | null;
  render: (t: Track) => string;
}

const fmtDur = (s: number | null): string => {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};
const fmtMb = (b: number | null): string => (b == null ? "—" : `${(b / 1048576).toFixed(1)} MB`);
const fmtDate = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const COLUMNS: ColumnDef[] = [
  {
    id: "name", label: "Naam", short: "Naam", kind: "text", defaultDir: "asc",
    ascLabel: "A → Z", descLabel: "Z → A",
    value: (t) => t.variant_label.toLowerCase(),
    render: (t) => t.variant_label,
  },
  {
    id: "duration", label: "Duur", short: "Duur", kind: "number", defaultDir: "desc",
    ascLabel: "kort → lang", descLabel: "lang → kort",
    value: (t) => t.duration_seconds,
    render: (t) => fmtDur(t.duration_seconds),
  },
  {
    id: "bpm", label: "BPM", short: "BPM", kind: "number", defaultDir: "desc",
    ascLabel: "traag → snel", descLabel: "snel → traag",
    value: (t) => t.bpm,
    render: (t) => (t.bpm != null ? `${Math.round(t.bpm)} BPM` : "—"),
  },
  {
    id: "key", label: "Toonsoort", short: "Key", kind: "text", defaultDir: "asc",
    ascLabel: "A → Z", descLabel: "Z → A",
    value: (t) => (t.musical_key ?? "").toLowerCase(),
    render: (t) => t.musical_key ?? "—",
  },
  {
    id: "size", label: "Bestandsgrootte", short: "Grootte", kind: "number", defaultDir: "desc",
    ascLabel: "klein → groot", descLabel: "groot → klein",
    value: (t) => t.file_size_bytes,
    render: (t) => fmtMb(t.file_size_bytes),
  },
  {
    id: "date", label: "Eerste verschijning", short: "Datum", kind: "date", defaultDir: "desc",
    ascLabel: "oud → nieuw", descLabel: "nieuw → oud",
    value: (t) => (t.first_seen_at ? Date.parse(t.first_seen_at) : null),
    render: (t) => fmtDate(t.first_seen_at),
  },
  {
    id: "kind", label: "Soort", short: "Soort", kind: "text", defaultDir: "asc",
    ascLabel: "A → Z", descLabel: "Z → A",
    value: (t) => t.track_kind,
    render: (t) => t.track_kind.replace("_", " "),
  },
  {
    id: "status", label: "Status", short: "Status", kind: "text", defaultDir: "asc",
    ascLabel: "A → Z", descLabel: "Z → A",
    value: (t) => t.status,
    render: (t) => t.status.replace("_", " "),
  },
  {
    id: "format", label: "Formaat", short: "Formaat", kind: "text", defaultDir: "asc",
    ascLabel: "A → Z", descLabel: "Z → A",
    value: (t) => t.format ?? "",
    render: (t) => (t.format ? t.format.toUpperCase() : "—"),
  },
  {
    id: "folder", label: "Map", short: "Map", kind: "text", defaultDir: "asc",
    ascLabel: "A → Z", descLabel: "Z → A",
    value: (t) => t.folder.toLowerCase(),
    render: (t) => t.folder || "(root)",
  },
];

export const COLUMN_BY_ID = new Map(COLUMNS.map((c) => [c.id, c]));

/** Sorteer een lijst tracks op een kolom. Nulls belanden altijd onderaan. */
export function sortTracks(list: Track[], columnId: string, dir: "asc" | "desc"): Track[] {
  const col = COLUMN_BY_ID.get(columnId);
  if (!col) return list;
  const factor = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const va = col.value(a);
    const vb = col.value(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;   // nulls onderaan, ongeacht richting
    if (vb == null) return -1;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor;
    return String(va).localeCompare(String(vb), "nl") * factor;
  });
}
