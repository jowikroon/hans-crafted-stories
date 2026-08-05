import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cpu, ExternalLink, LogIn, RefreshCw, Wifi } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useForcedTheme } from "@/hooks/useTheme";

/* ─────────────────────────────────────────────────────────────
   /pi — Raspberry Pi 5 dashboard achter login (profielmenu).
   Embedt CasaOS op de Pi via Cloudflare Tunnel
   (https://pi.hansvanleeuwen.com). Directe LAN-embed
   (http://192.168.178.86) kan niet vanaf een https-site
   (mixed content) — daarom de tunnel-URL met LAN-fallback-link.
   ───────────────────────────────────────────────────────────── */

const PI_TUNNEL_URL = "https://pi.hansvanleeuwen.com";
const PI_LAN_URL = "http://192.168.178.86";
const LOAD_TIMEOUT_MS = 10_000;

const PiDashboard = () => {
  // Backend surface: altijd light, consistent met /portal en /dashboards.
  useForcedTheme("light");
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (loaded) return;
    const t = window.setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [loaded, reloadKey]);

  if (!user) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="mb-4 text-sm text-[#7E7A6F]">Log in om het Raspberry Pi dashboard te openen.</p>
        <Link to="/portal" className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors">
          <LogIn size={14} /> Inloggen
        </Link>
      </div>
    );
  }
  if (adminLoading) return <div className="px-6 py-24 text-center text-sm text-[#7E7A6F]">Toegang controleren…</div>;
  if (!isAdmin) return <div className="px-6 py-24 text-center text-sm text-[#7E7A6F]">Geen toegang tot het Pi dashboard.</div>;

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-[#FBF8F0]">
      <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.07] px-4 py-2.5 sm:px-6">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#15140F]">
          <Cpu size={16} /> Raspberry Pi 5
        </span>
        <span className="text-xs text-[#7E7A6F]">CasaOS · {loaded ? "verbonden" : timedOut ? "niet bereikbaar" : "verbinden…"}</span>
        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setLoaded(false); setTimedOut(false); setReloadKey((k) => k + 1); }}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-[#4B4842] hover:bg-[#E5DFCE]/60 transition-colors"
          >
            <RefreshCw size={12} /> Vernieuw
          </button>
          <a href={PI_TUNNEL_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-[#4B4842] hover:bg-[#E5DFCE]/60 transition-colors">
            <ExternalLink size={12} /> Nieuw tabblad
          </a>
          <a href={PI_LAN_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-[#4B4842] hover:bg-[#E5DFCE]/60 transition-colors">
            <Wifi size={12} /> LAN
          </a>
        </span>
      </div>

      {timedOut && !loaded && (
        <div className="mx-auto mt-16 max-w-md rounded-xl border border-black/10 bg-white/60 px-6 py-8 text-center">
          <p className="mb-2 text-sm font-medium text-[#15140F]">Pi dashboard niet bereikbaar via de tunnel.</p>
          <p className="mb-4 text-xs leading-relaxed text-[#7E7A6F]">
            De Cloudflare Tunnel op de Pi draait nog niet, of de Pi staat uit. Op het thuisnetwerk werkt de
            directe <a href={PI_LAN_URL} target="_blank" rel="noreferrer" className="underline">LAN-link</a> altijd.
            Tunnel activeren: zie <code className="font-mono text-[11px]">setup-pi-tunnel.sh</code> in de vault.
          </p>
          <button
            type="button"
            onClick={() => { setLoaded(false); setTimedOut(false); setReloadKey((k) => k + 1); }}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-1.5 text-xs font-medium text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"
          >
            <RefreshCw size={12} /> Opnieuw proberen
          </button>
        </div>
      )}

      <iframe
        key={reloadKey}
        src={PI_TUNNEL_URL}
        title="Raspberry Pi 5 — CasaOS dashboard"
        onLoad={() => { setLoaded(true); setTimedOut(false); }}
        className={`w-full flex-1 border-0 ${timedOut && !loaded ? "hidden" : ""}`}
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
};

export default PiDashboard;
