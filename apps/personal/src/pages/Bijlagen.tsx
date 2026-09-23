import { useState } from "react";
import { ExternalLink, Paperclip, Search } from "lucide-react";
import DashboardShell from "./dashboards/DashboardShell";
import attachments from "@/data/coworkAttachments.json";

interface Attachment {
  name: string;
  size: number;
  modified: string;
  url?: string;
}

// Preserve the existing collection. A metadata-only entry must never acquire
// a guessed public URL when documents move to private storage.
const files: Attachment[] = [...attachments].sort((a, b) => b.modified.localeCompare(a.modified));
const fileSize = (bytes: number) => bytes >= 1024 * 1024
  ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function Bijlagen() {
  const [query, setQuery] = useState("");
  const visible = files.filter((file) => file.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <DashboardShell title="Bijlagen" domain="Cowork-bestanden">
      <p className="mt-3 text-sm text-[#7E7A6F]">Je verzamelde Cowork-documenten, rapporten en spreadsheets. Nieuwste bestanden staan bovenaan.</p>
      <label className="my-6 flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
        <Search size={18} className="text-[#7E7A6F]" aria-hidden="true" />
        <span className="sr-only">Zoek bijlagen</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek op bestandsnaam…" className="w-full bg-transparent text-sm text-[#15140F] outline-none" />
      </label>
      <p role="status" className="mb-3 text-xs text-[#7E7A6F]">{visible.length} van {files.length} bestanden</p>
      <ul className="divide-y divide-black/10 overflow-hidden rounded-xl border border-black/10 bg-white">
        {visible.map((file) => (
          <li key={file.name} className="flex items-center gap-3 p-4">
            <Paperclip size={18} className="shrink-0 text-[#7E7A6F]" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-medium text-[#15140F]">{file.name}</p>
              <p className="mt-1 text-xs text-[#7E7A6F]">{new Date(file.modified).toLocaleDateString("nl-NL")} · {fileSize(file.size)}</p>
            </div>
            {file.url?.startsWith("/cowork/") ? (
              <a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${file.name}`} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm text-[#15140F] hover:bg-[#F1ECDF] focus-visible:outline focus-visible:outline-2">
                Open <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : <span className="text-xs text-[#7E7A6F]">Privé opgeslagen</span>}
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p className="py-8 text-center text-sm text-[#7E7A6F]">Geen bijlagen gevonden. Probeer een andere zoekterm.</p>}
    </DashboardShell>
  );
}
