import { useEffect, useState } from "react";
import DashboardShell from "./dashboards/DashboardShell";
import { supabase } from "@/integrations/supabase/client";

interface Attachment { name: string; size: number; modified: string; storage_path: string }
function Collection() {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      const rows: Attachment[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error: failure } = await supabase.from("cowork_attachments" as never)
          .select("name,size,modified,storage_path").order("modified", { ascending: false }).order("name").range(offset, offset + 999);
        if (failure) throw failure;
        rows.push(...(data as unknown as Attachment[]));
        if (!active || data.length < 1000) break;
      }
      if (active) setFiles(rows);
    }
    load().catch(() => { if (active) setError("Bijlagen konden niet worden geladen. Vernieuw de pagina om opnieuw te proberen."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function download(file: Attachment) {
    setBusy(file.name); setError("");
    try {
      const { data, error: failure } = await supabase.storage.from("cowork-attachments").download(file.storage_path);
      if (failure || !data) throw failure;
      // Save HTML as a download; never execute it inside the site's origin.
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url; link.download = file.name; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError("Download mislukt. Controleer of je nog bent ingelogd en probeer opnieuw."); }
    finally { setBusy(null); }
  }
  const visible = files.filter(file => file.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <p className="mt-3 text-sm text-[#7E7A6F]">Je verzamelde documenten, rapporten en spreadsheets. Downloads zijn alleen toegankelijk met je beheerdersaccount.</p>
    <label className="my-6 block rounded-xl border border-black/10 bg-white px-4 py-3">
      <span className="sr-only">Zoek bijlagen</span>
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Zoek op bestandsnaam" className="w-full bg-transparent text-sm text-[#15140F]" />
    </label>
    {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
    <p role="status" className="mb-3 text-xs text-[#7E7A6F]">{loading ? "Bijlagen laden..." : `${visible.length} van ${files.length} bestanden`}</p>
    <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
      {visible.map(file => <li key={file.name} className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-medium text-[#15140F]">{file.name}</p>
          <p className="mt-1 text-xs text-[#7E7A6F]">{new Date(file.modified).toLocaleDateString("nl-NL")} · {Math.max(1, Math.round(file.size / 1024))} KB</p>
        </div>
        <button type="button" disabled={busy !== null} onClick={() => void download(file)} aria-label={`Download ${file.name}`} className="rounded-lg px-3 py-2 text-sm text-[#15140F] hover:bg-[#F1ECDF] disabled:opacity-50">{busy === file.name ? "Downloaden..." : "Download"}</button>
      </li>)}
    </ul>
    {!loading && !error && visible.length === 0 && <p className="py-8 text-center text-sm text-[#7E7A6F]">{files.length ? "Geen bijlagen gevonden. Probeer een andere zoekterm." : "Er zijn nog geen bijlagen gesynchroniseerd."}</p>}
  </>;
}
export default function Bijlagen() {
  return <DashboardShell title="Bijlagen" domain="Cowork-bestanden"><Collection /></DashboardShell>;
}
