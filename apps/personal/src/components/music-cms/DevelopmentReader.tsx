import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { ArtworkAsset } from "./lib/artworkModel";
import { drivePageLinks, type DevelopmentPage } from "./lib/developmentLibrary";
import { matchArtwork, prepareDevelopmentDocument } from "./lib/developmentReader";

export default function DevelopmentReader({ page, assets, onClose }: { page: DevelopmentPage; assets: ArtworkAsset[]; onClose: () => void }) {
  const [result, setResult] = useState<{ html: string; missing: number }>();
  const [error, setError] = useState("");
  const links = drivePageLinks(page.hosted_url);
  useEffect(() => {
    let active = true;
    setResult(undefined); setError("");
    async function load() {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error: requestError } = await supabase.functions.invoke("neon-development-page", { body: { pageId: page.id } });
      if (requestError) {
        const detail = await requestError.context?.json?.().catch(() => null);
        throw new Error(detail?.error || "De online pagina kon niet worden geladen. Het origineel blijft in Drive beschikbaar.");
      }
      if (!data?.html || typeof data.html !== "string") throw new Error("Drive heeft geen HTML-pagina teruggegeven.");
      const doc = new DOMParser().parseFromString(data.html, "text/html");
      const mapping = new Map<string, string>();
      doc.querySelectorAll("[src],[poster]").forEach(el => {
        for (const attr of ["src", "poster"]) {
          const raw = el.getAttribute(attr); if (!raw || raw.startsWith("data:")) continue;
          const asset = matchArtwork(raw, page.local_path, assets);
          const path = asset?.media_type === "video" ? asset.playback_path : asset?.storage_path;
          if (path) mapping.set(raw, path);
        }
      });
      const resources = new Map<string, string>();
      if (mapping.size) {
        const { data: signed, error: signingError } = await supabase.functions.invoke("artwork-sign", { body: { paths: [...new Set(mapping.values())], expires: 3600 } });
        if (!signingError && Array.isArray(signed?.urls)) {
          const urls = new Map<string, string>(signed.urls.map((u: { path: string; signedUrl: string }) => [u.path, u.signedUrl]));
          mapping.forEach((path, raw) => { const url = urls.get(path); if (url) resources.set(raw, url); });
        }
      }
      if (active) setResult(prepareDevelopmentDocument(data.html, resources));
    }
    void load().catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [page, assets]);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="neon-reader-dialog">
    <DialogTitle>{page.title}</DialogTitle>
    <DialogDescription>Privéleesversie uit Google Drive. Scripts en externe embeds staan uit; het originele bestand blijft ongewijzigd.</DialogDescription>
    <div className="neon-reader-actions">{links && <><a href={links.view} target="_blank" rel="noopener noreferrer">Open in Drive</a><a href={links.download} target="_blank" rel="noopener noreferrer">Download uit Drive</a></>}</div>
    {error ? <p role="alert">{error}</p> : !result ? <p role="status">Pagina en beelden laden…</p> : <>
      {result.missing > 0 && <p className="neon-reader-warning" role="status">{result.missing} mediaverwijzingen zijn nog niet online gekoppeld. Deze leesversie is daardoor onvolledig.</p>}
      <iframe title={`Leesversie: ${page.title}`} sandbox="" referrerPolicy="no-referrer" srcDoc={result.html} />
    </>}
  </DialogContent></Dialog>;
}
