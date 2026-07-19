import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3, Package, TrendingUp, Search, Euro, Percent, Gauge, Settings2, LogIn, Lock,
  Paperclip, FileText, Download, CalendarDays, HardDrive, Truck, Warehouse, Home, MapPin,
  Radar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import coworkAttachments from "@/data/coworkAttachments.json";
import CompetitionRadarPanel from "@/components/dashboard/CompetitionRadarPanel";

/* ─────────────────────────────────────────────────────────────
   /dashboards — klant-dashboards achter login (profielmenu).
   Klant: ConnectCarParts (eBay DE). Data: Supabase, RLS =
   alleen authenticated admin (policy admin_read_*). Geen
   bedrijfscijfers hardcoded in deze file — alles uit de DB.
   ───────────────────────────────────────────────────────────── */

type Row = Record<string, unknown>;
const num = (v: unknown) => (typeof v === "number" ? v : parseFloat(String(v ?? 0)) || 0);
const eur = (v: number) => "€" + v.toLocaleString("nl-NL", { maximumFractionDigits: 0 });
const eur2 = (v: number) => "€" + v.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dt = (s: unknown) => (s ? new Date(String(s)).toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit" }) : "—");

const SECTIONS = [
  { id: "overzicht", label: "Overzicht", icon: BarChart3 },
  { id: "attachments", label: "Attachments", icon: Paperclip },
  { id: "concurrentie", label: "Concurrentie Radar", icon: Radar },
  { id: "shipments", label: "Shipments", icon: Truck },
  { id: "orders", label: "Orders", icon: Package },
  { id: "verkoop", label: "Verkoopresultaten", icon: TrendingUp },
  { id: "product", label: "Productinzichten", icon: Search },
  { id: "afdracht", label: "Afdrachten & fees", icon: Euro },
  { id: "marge", label: "Marges per categorie", icon: Percent },
  { id: "pl", label: "PL & Velocity", icon: Gauge },
  { id: "systeem", label: "Systeemstatus", icon: Settings2 },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

interface Data {
  orders: Row[]; lineItems: Row[]; transactions: Row[]; payouts: Row[];
  traffic: Row[]; alerts: Row[]; econ: Row[]; fixed: Row[]; listings: number;
}

interface Attachment {
  name: string;
  size: number;
  modified: string;
  url: string;
}

const EMPTY_HINT =
  "Data stroomt automatisch binnen zodra de eBay API-koppeling geautoriseerd is en de eerste orders na livegang binnenkomen.";

const Card = ({ k, v, s }: { k: string; v: string | number; s?: string }) => (
  <div className="rounded-lg border border-black/10 bg-[#FBF8F0] px-4 py-3 dark:border-white/10 dark:bg-white/5">
    <p className="text-[11px] uppercase tracking-wide text-[#7E7A6F]">{k}</p>
    <p className="mt-0.5 text-xl font-semibold text-[#15140F] dark:text-[#F5F1E6]">{v}</p>
    {s && <p className="text-[11px] text-[#7E7A6F]">{s}</p>}
  </div>
);

const Empty = ({ what }: { what: string }) => (
  <div className="rounded-xl border border-dashed border-black/15 bg-[#FBF8F0] px-6 py-10 text-center text-sm text-[#7E7A6F] dark:border-white/15 dark:bg-white/5">
    <p className="mb-1 font-medium text-[#15140F] dark:text-[#F5F1E6]">Nog geen {what}</p>
    {EMPTY_HINT}
  </div>
);

const attachmentCategory = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("concurrentie-radar")) return "Concurrentie Radar";
  if (lower.includes("ceo") || lower.includes("rapport") || lower.includes("dossier")) return "Rapporten";
  if (lower.includes("blueprint") || lower.includes("playbook") || lower.includes("roadmap") || lower.includes("checklist")) return "Blueprints & checklists";
  if (lower.includes("returnless") || lower.includes("retour")) return "Retourflow";
  if (lower.includes("channable") || lower.includes("magento") || lower.includes("item-specifics") || lower.includes("veld")) return "Channable & Magento";
  if (lower.includes("top400") || lower.endsWith(".xlsx") || lower.endsWith(".txt")) return "Data exports";
  return "Overig";
};

const attachmentVersionKey = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const stem = name.replace(/\.[^.]+$/, "").toLowerCase()
    .replace(/\b20\d{2}[-_. ]?\d{2}[-_. ]?\d{2}\b/g, "")
    .replace(/\bv\d+\b/g, "")
    .replace(/\blive\b/g, "")
    .replace(/[-_. ]+/g, " ")
    .trim();
  return `${stem}.${ext}`;
};

const formatBytes = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
};

const formatModified = (value: string) =>
  new Date(value).toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const dateMs = (value: unknown) => {
  if (!value) return null;
  const ms = new Date(String(value)).getTime();
  return Number.isFinite(ms) ? ms : null;
};

const pick = (row: Row, keys: string[]) => keys.map((key) => row[key]).find((value) => value !== undefined && value !== null && String(value).trim() !== "");

const isShippedLike = (row: Row) => {
  const status = String(row.fulfillment_status ?? row.order_fulfillment_status ?? "").toLowerCase();
  return /ship|fulfill|sent|onderweg|verzonden|complete|delivered/.test(status);
};

const isDeliveredLike = (row: Row) => {
  const status = String(row.fulfillment_status ?? row.order_fulfillment_status ?? "").toLowerCase();
  return /deliver|afgeleverd|complete/.test(status);
};

const shipmentStartedAt = (row: Row) =>
  dateMs(pick(row, ["tracking_created_at", "tracking_uploaded_at", "tracking_at", "shipped_at", "shipment_date", "fulfillment_date", "last_modified_date"])) ??
  (isShippedLike(row) ? dateMs(row.creation_date) : null);

const shipmentDeliveredAt = (row: Row) =>
  dateMs(pick(row, ["delivered_at", "delivery_date", "actual_delivery_date"])) ??
  (isDeliveredLike(row) ? Date.now() : null);

const trackingCode = (row: Row) =>
  String(pick(row, ["tracking_number", "tracking_code", "shipment_tracking_number", "track_and_trace", "tt_code"]) ?? "");

const shipmentProgress = (row: Row, now: number) => {
  const start = shipmentStartedAt(row);
  if (!start) return { percent: 0, stage: "Wacht op T&T", eta: null as number | null, started: false };

  const hub = dateMs(pick(row, ["hub_arrived_at", "sorting_center_at", "in_transit_at"])) ?? start + 4 * 60 * 60 * 1000;
  const delivered = shipmentDeliveredAt(row) ?? hub + 2 * 24 * 60 * 60 * 1000;

  if (now >= delivered) return { percent: 100, stage: "Aangekomen bij klant", eta: delivered, started: true };
  if (now >= hub) {
    const pct = 50 + ((now - hub) / Math.max(delivered - hub, 1)) * 50;
    return { percent: Math.min(99, Math.max(50, pct)), stage: "Onderweg naar klant", eta: delivered, started: true };
  }
  const pct = ((now - start) / Math.max(hub - start, 1)) * 50;
  return { percent: Math.min(49, Math.max(1, pct)), stage: "Onderweg naar sorteerpunt", eta: hub, started: true };
};

const etaText = (eta: number | null, now: number) => {
  if (!eta) return "geen ETA";
  const diff = eta - now;
  if (diff <= 0) return "bereikt";
  const hours = Math.floor(diff / 36e5);
  const minutes = Math.round((diff % 36e5) / 6e4);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}u`;
  if (hours > 0) return `${hours}u ${minutes}m`;
  return `${minutes}m`;
};

const allAttachments = coworkAttachments as Attachment[];

const latestAttachments = allAttachments
  .reduce<Record<string, Attachment>>((acc, file) => {
    const key = attachmentVersionKey(file.name);
    const current = acc[key];
    if (!current) {
      acc[key] = file;
      return acc;
    }
    const fileTime = new Date(file.modified).getTime();
    const currentTime = new Date(current.modified).getTime();
    const newerAndNotSmaller = fileTime >= currentTime && file.size >= current.size;
    const newerAndCloseInSize = fileTime > currentTime && file.size >= current.size * 0.8;
    if (newerAndNotSmaller || newerAndCloseInSize || (fileTime === currentTime && file.size > current.size)) acc[key] = file;
    return acc;
  }, {});

const sortedAttachments = Object.values(latestAttachments)
  .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime() || b.size - a.size);

const attachmentGroups = sortedAttachments
  .reduce<Record<string, Attachment[]>>((acc, file) => {
    const category = attachmentCategory(file.name);
    acc[category] = acc[category] ?? [];
    acc[category].push(file);
    return acc;
  }, {});

const Tbl = ({ head, rows }: { head: string[]; rows: (string | number)[][] }) => (
  <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-[#E5DFCE]/60 text-left text-[#15140F] dark:bg-white/10 dark:text-[#F5F1E6]">
          {head.map((h) => <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-black/[0.06] text-[#4B4842] dark:border-white/[0.06] dark:text-[#C9BFB0]">
            {r.map((c, j) => <td key={j} className="px-3 py-2 whitespace-nowrap">{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AttachmentsPanel = () => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card k="Nieuwste bestand" v={sortedAttachments[0]?.name ?? "Geen"} s={sortedAttachments[0] ? formatModified(sortedAttachments[0].modified) : undefined} />
      <Card k="Unieke documenten" v={sortedAttachments.length} s={`${allAttachments.length} bronbestanden`} />
      <Card k="Categorieen" v={Object.keys(attachmentGroups).length} />
      <Card k="Map" v="CCP eBay DE" s="cowork attachments" />
    </div>

    {Object.entries(attachmentGroups).map(([category, files]) => (
      <section key={category} className="space-y-2">
        <h2 className="text-sm font-semibold text-[#15140F] dark:text-[#F5F1E6]">{category}</h2>
        <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          {files.map((file) => (
            <a
              key={file.url}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="grid gap-3 border-t border-black/[0.06] bg-[#FBF8F0] px-4 py-3 text-sm transition-colors first:border-t-0 hover:bg-[#E5DFCE]/70 md:grid-cols-[1fr_auto_auto_auto] dark:border-white/[0.06] dark:bg-white/5 dark:hover:bg-white/10"
            >
              <span className="flex min-w-0 items-center gap-2 font-medium text-[#15140F] dark:text-[#F5F1E6]">
                <FileText size={15} className="shrink-0 text-[#7E7A6F]" />
                <span className="truncate">{file.name}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#7E7A6F]"><CalendarDays size={13} /> {formatModified(file.modified)}</span>
              <span className="inline-flex items-center gap-1 text-xs text-[#7E7A6F]"><HardDrive size={13} /> {formatBytes(file.size)}</span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#15140F] dark:text-[#F5F1E6]"><Download size={13} /> Open</span>
            </a>
          ))}
        </div>
      </section>
    ))}
  </div>
);

const ShipmentVehicle = ({ percent, active }: { percent: number; active: boolean }) => (
  <div
    className="absolute top-1/2 z-10 h-7 w-12 -translate-y-1/2 transition-[left] duration-700 ease-out"
    style={{ left: `calc(${percent}% - 24px)` }}
    aria-hidden="true"
  >
    <div className={`relative h-5 rounded-sm border ${active ? "border-[#2D9255]/60 bg-[#2D9255]" : "border-[#7E7A6F]/40 bg-[#C9BFB0]"}`}>
      <div className="absolute -right-1 top-1 h-4 w-4 rounded-r-sm border border-current bg-inherit" />
      <div className="absolute left-2 top-1 h-1.5 w-3 rounded-[2px] bg-white/55" />
      <div className="absolute right-1 top-1 h-1.5 w-2 rounded-[2px] bg-white/55" />
      <span className="absolute bottom-[-6px] left-1 h-2 w-2 rounded-full border border-[#15140F]/30 bg-[#15140F]" />
      <span className="absolute bottom-[-6px] right-1 h-2 w-2 rounded-full border border-[#15140F]/30 bg-[#15140F]" />
    </div>
  </div>
);

const ShipmentRoute = ({ order, now }: { order: Row; now: number }) => {
  const progress = shipmentProgress(order, now);
  const track = trackingCode(order);
  const status = String(order.fulfillment_status ?? "—");
  return (
    <article className="rounded-lg border border-black/10 bg-[#FBF8F0] p-4 dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#15140F] dark:text-[#F5F1E6]">{String(order.order_id ?? "Order")}</p>
          <p className="mt-0.5 text-xs text-[#7E7A6F]">{status} · {track ? `T&T ${track}` : progress.started ? "tracking actief" : "nog geen T&T"}</p>
        </div>
        <div className="text-right text-xs text-[#7E7A6F]">
          <p className="font-medium text-[#15140F] dark:text-[#F5F1E6]">{progress.stage}</p>
          <p>ETA {etaText(progress.eta, now)}</p>
        </div>
      </div>

      <div className="relative h-16">
        <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-[#C9BFB0] dark:bg-white/15" />
        <div className="absolute left-4 top-1/2 h-px -translate-y-1/2 bg-[#2D9255]" style={{ width: `${progress.percent}%` }} />
        <ShipmentVehicle percent={progress.percent} active={progress.started && progress.percent < 100} />
        {[
          { left: "0%", label: "Magazijn", icon: Warehouse },
          { left: "50%", label: "Onderweg", icon: MapPin },
          { left: "100%", label: "Klant", icon: Home },
        ].map(({ left, label, icon: Icon }, index) => (
          <div key={label} className="absolute top-1/2 flex -translate-y-1/2 -translate-x-1/2 flex-col items-center gap-1" style={{ left }}>
            <span className={`grid h-8 w-8 place-items-center rounded-md border text-[11px] ${
              progress.percent >= index * 50
                ? "border-[#2D9255]/40 bg-[#2D9255]/15 text-[#2D9255]"
                : "border-black/10 bg-[#FBF8F0] text-[#7E7A6F] dark:border-white/10 dark:bg-white/5"
            }`}>
              <Icon size={14} />
            </span>
            <span className="whitespace-nowrap text-[10px] font-medium text-[#7E7A6F]">{label}</span>
          </div>
        ))}
      </div>
    </article>
  );
};

const ShipmentsPanel = ({ orders, now }: { orders: Row[]; now: number }) => {
  const shipmentRows = orders
    .filter((row) => shipmentStartedAt(row) || isShippedLike(row))
    .sort((a, b) => (shipmentStartedAt(b) ?? 0) - (shipmentStartedAt(a) ?? 0))
    .slice(0, 20);
  const moving = shipmentRows.filter((row) => {
    const pct = shipmentProgress(row, now).percent;
    return pct > 0 && pct < 100;
  }).length;
  const delivered = shipmentRows.filter((row) => shipmentProgress(row, now).percent >= 100).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card k="Shipments" v={shipmentRows.length} s="met T&T of verzonden status" />
        <Card k="Onderweg" v={moving} s="busje beweegt op route" />
        <Card k="Afgeleverd" v={delivered} />
        <Card k="Timing" v="4u + 2d" s="magazijn · hub · klant" />
      </div>

      {shipmentRows.length ? (
        <div className="space-y-3">
          {shipmentRows.map((order, index) => <ShipmentRoute key={String(order.order_id ?? index)} order={order} now={now} />)}
        </div>
      ) : (
        <Empty what="shipments met T&T" />
      )}
    </div>
  );
};

const Dashboards = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [section, setSection] = useState<SectionId>("overzicht");
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // PL & velocity aannames (client-side rekenmodel; bronprijzen uit DB)
  const [disc, setDisc] = useState(10);
  const [plRate, setPlRate] = useState(6);
  const [nHard, setNHard] = useState(25);
  const [opw, setOpw] = useState(2);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (section !== "shipments") return;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [section]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    (async () => {
      try {
        const [orders, lineItems, transactions, payouts, traffic, alerts, econ, fixed, listings] = await Promise.all([
          supabase.from("ebay_orders").select("order_id,creation_date,total_value,fulfillment_status,payment_status").order("creation_date", { ascending: false }).limit(500),
          supabase.from("ebay_order_line_items").select("sku,title,quantity,unit_price").limit(1000),
          supabase.from("ebay_transactions").select("transaction_type,amount,fee_amount,transaction_date").limit(1000),
          supabase.from("ebay_payouts").select("payout_id,payout_date,amount,status,transaction_count").order("payout_date", { ascending: false }).limit(12),
          supabase.from("ebay_traffic_daily").select("listing_id,listing_impression_total,listing_views,transactions").limit(1000),
          supabase.from("channable_order_alerts_sent").select("order_id,channel_name,error_reason,alerted_at").order("alerted_at", { ascending: false }).limit(15),
          supabase.from("ccp_category_economics").select("*").eq("marketplace", "ebay").order("category"),
          supabase.from("ccp_channel_fixed_costs").select("cost_name,monthly_cost,notes").eq("marketplace", "ebay"),
          supabase.from("ebay_listings").select("id", { count: "exact", head: true }),
        ]);
        const firstErr = [orders, lineItems, transactions, payouts, traffic, alerts, econ, fixed].find((r) => r.error);
        if (firstErr?.error) throw new Error(firstErr.error.message);
        setData({
          orders: orders.data ?? [], lineItems: lineItems.data ?? [], transactions: transactions.data ?? [],
          payouts: payouts.data ?? [], traffic: traffic.data ?? [], alerts: alerts.data ?? [],
          econ: econ.data ?? [], fixed: fixed.data ?? [], listings: listings.count ?? 0,
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Onbekende fout");
      }
    })();
  }, [user, isAdmin]);

  const agg = useMemo(() => {
    if (!data) return null;
    const now = Date.now();
    const inDays = (r: Row, d: number) => now - new Date(String(r.creation_date)).getTime() < d * 864e5;
    const o7 = data.orders.filter((r) => inDays(r, 7));
    const o30 = data.orders.filter((r) => inDays(r, 30));
    const rev = (rows: Row[]) => rows.reduce((s, r) => s + num(r.total_value), 0);
    const fees = data.transactions.reduce((s, r) => s + num(r.fee_amount), 0);
    const topSkus = Object.values(
      data.lineItems.reduce<Record<string, { sku: string; title: string; qty: number; rev: number }>>((acc, r) => {
        const k = String(r.sku ?? "?");
        acc[k] = acc[k] ?? { sku: k, title: String(r.title ?? ""), qty: 0, rev: 0 };
        acc[k].qty += num(r.quantity);
        acc[k].rev += num(r.quantity) * num(r.unit_price);
        return acc;
      }, {}),
    ).sort((a, b) => b.rev - a.rev).slice(0, 15);
    const imp = data.traffic.reduce((s, r) => s + num(r.listing_impression_total), 0);
    const views = data.traffic.reduce((s, r) => s + num(r.listing_views), 0);
    return { o7, o30, rev7: rev(o7), rev30: rev(o30), fees, topSkus, imp, views };
  }, [data]);

  const plRows = useMemo(() => {
    if (!data) return [];
    const cats = data.econ.filter((r) => num(r.avg_selling_price) > 0 || num(r.avg_purchase_price) > 0);
    const per = cats.length ? Math.round(nHard / cats.length) : 0;
    return cats.map((r) => {
      const asp = num(r.avg_selling_price), buy = num(r.avg_purchase_price);
      const fee = num(r.fee_pct) || 11, fix = num(r.fixed_fee_per_order), ship = num(r.shipping_cost_per_order);
      const normC = asp / 1.19 - buy - (asp * fee) / 100 - fix - ship;
      const margin = asp > 0 ? (normC / (asp / 1.19)) * 100 : 0;
      const intro = asp * (1 - disc / 100);
      const introC = intro / 1.19 - buy - (intro * fee) / 100 - fix - ship - intro * (plRate / 100) * 0.5;
      const orders = per * opw;
      return { cat: String(r.category), asp, margin, normC, introC, orders, inv: (normC - introC) * orders, plOk: margin >= 25 };
    });
  }, [data, disc, plRate, nHard, opw]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <Lock className="mx-auto mb-4 text-[#7E7A6F]" size={28} />
        <h1 className="mb-2 text-xl font-semibold text-[#15140F] dark:text-[#F5F1E6]">Dashboards</h1>
        <p className="mb-6 text-sm text-[#7E7A6F]">Deze pagina is alleen zichtbaar na inloggen.</p>
        <Link to="/portal" className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-2 text-sm font-medium text-[#15140F] hover:bg-[#E5DFCE] dark:border-white/15 dark:text-[#F5F1E6] dark:hover:bg-white/10">
          <LogIn size={14} /> Inloggen
        </Link>
      </div>
    );
  }
  if (adminLoading) return <div className="px-6 py-24 text-center text-sm text-[#7E7A6F]">Laden…</div>;
  if (!isAdmin) return <div className="px-6 py-24 text-center text-sm text-[#7E7A6F]">Geen toegang tot klant-dashboards.</div>;

  const aov7 = agg && agg.o7.length ? agg.rev7 / agg.o7.length : 0;

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 pb-20 sm:px-6">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 md:block">
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[#7E7A6F]">Klanten</p>
        <p className="flex items-center gap-2 rounded-lg bg-[#E5DFCE]/70 px-3 py-2 text-sm font-semibold text-[#15140F] dark:bg-white/10 dark:text-[#F5F1E6]">
          ConnectCarParts <span className="ml-auto rounded bg-[#2D9255]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#2D9255]">eBay DE</span>
        </p>
        <nav className="mt-2 flex flex-col gap-0.5">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSection(id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                section === id
                  ? "bg-[#FBF8F0] font-medium text-[#15140F] shadow-sm dark:bg-white/10 dark:text-[#F5F1E6]"
                  : "text-[#7E7A6F] hover:bg-[#E5DFCE]/50 hover:text-[#15140F] dark:hover:bg-white/5 dark:hover:text-[#F5F1E6]"
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Mobile section picker */}
        <select value={section} onChange={(e) => setSection(e.target.value as SectionId)}
          className="mb-4 w-full rounded-lg border border-black/10 bg-[#FBF8F0] px-3 py-2 text-sm md:hidden dark:border-white/10 dark:bg-white/5 dark:text-[#F5F1E6]">
          {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>

        <h1 className="mb-1 text-2xl font-semibold text-[#15140F] dark:text-[#F5F1E6]">
          {SECTIONS.find((s) => s.id === section)?.label}
        </h1>
        <p className="mb-5 text-sm text-[#7E7A6F]">ConnectCarParts · eBay DE · {section === "concurrentie" ? "wekelijkse research-sync" : "live uit Supabase"}</p>

        {err && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Fout bij laden: {err}</p>}
        {section === "attachments" && <AttachmentsPanel />}
        {section === "concurrentie" && <CompetitionRadarPanel />}
        {section === "shipments" && data && <ShipmentsPanel orders={data.orders} now={now} />}
        {section !== "attachments" && section !== "concurrentie" && !data && !err && <p className="text-sm text-[#7E7A6F]">Laden…</p>}

        {section !== "attachments" && section !== "concurrentie" && section !== "shipments" && data && agg && (
          <>
            {section === "overzicht" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Card k="Omzet 7 dagen" v={eur(agg.rev7)} s={`${agg.o7.length} orders · AOV ${eur2(aov7)}`} />
                  <Card k="Omzet 30 dagen" v={eur(agg.rev30)} s={`${agg.o30.length} orders`} />
                  <Card k="Fees totaal" v={eur2(agg.fees)} s={agg.rev30 > 0 ? `${((agg.fees / agg.rev30) * 100).toFixed(1)}% effectief` : "—"} />
                  <Card k="Actieve listings" v={data.listings} s={`${data.alerts.length} order-alerts`} />
                </div>
                {data.orders.length === 0 && <Empty what="verkoopdata" />}
              </div>
            )}

            {section === "orders" && (
              <div className="space-y-6">
                {data.orders.length ? (
                  <Tbl head={["Order", "Datum", "Bedrag", "Fulfilment", "Betaling"]}
                    rows={data.orders.slice(0, 25).map((r) => [String(r.order_id), dt(r.creation_date), eur2(num(r.total_value)), String(r.fulfillment_status ?? "—"), String(r.payment_status ?? "—")])} />
                ) : <Empty what="orders" />}
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-[#15140F] dark:text-[#F5F1E6]">Order-alerts (15-min monitor)</h2>
                  {data.alerts.length ? (
                    <Tbl head={["Order", "Kanaal", "Fout", "Gemeld"]}
                      rows={data.alerts.map((r) => [String(r.order_id), String(r.channel_name ?? "—"), String(r.error_reason ?? "—"), dt(r.alerted_at)])} />
                  ) : <p className="text-sm text-[#7E7A6F]">Geen openstaande order-fouten.</p>}
                </div>
              </div>
            )}

            {section === "verkoop" && (
              agg.topSkus.length ? (
                <Tbl head={["SKU", "Product", "Stuks", "Omzet"]}
                  rows={agg.topSkus.map((r) => [r.sku, r.title.slice(0, 60), r.qty, eur2(r.rev)])} />
              ) : <Empty what="verkochte producten" />
            )}

            {section === "product" && (
              data.traffic.length ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    <Card k="Impressies" v={agg.imp.toLocaleString("nl-NL")} />
                    <Card k="Views" v={agg.views.toLocaleString("nl-NL")} s={agg.imp > 0 ? `${((agg.views / agg.imp) * 100).toFixed(2)}% CTR` : ""} />
                  </div>
                </div>
              ) : <Empty what="traffic-data (eBay Analytics)" />
            )}

            {section === "afdracht" && (
              data.payouts.length ? (
                <Tbl head={["Payout", "Datum", "Bedrag", "Status", "Transacties"]}
                  rows={data.payouts.map((r) => [String(r.payout_id), dt(r.payout_date), eur2(num(r.amount)), String(r.status ?? "—"), num(r.transaction_count)])} />
              ) : <Empty what="uitbetalingen" />
            )}

            {section === "marge" && (
              <div className="space-y-4">
                <Tbl head={["Categorie", "SKU’s", "Verkoopprijs", "Inkoop", "Fee%", "Verzend", "Bron"]}
                  rows={data.econ.map((r) => [
                    String(r.category), num(r.sku_count) || "—",
                    num(r.avg_selling_price) ? eur2(num(r.avg_selling_price)) : "wacht op sync",
                    num(r.avg_purchase_price) ? eur2(num(r.avg_purchase_price)) : "—",
                    `${num(r.fee_pct).toFixed(1)}%`, eur2(num(r.shipping_cost_per_order)), String(r.source ?? ""),
                  ])} />
                <Tbl head={["Vaste kanaalkosten", "€/maand"]}
                  rows={data.fixed.map((r) => [String(r.cost_name), eur2(num(r.monthly_cost))])} />
              </div>
            )}

            {section === "pl" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-black/10 bg-[#FBF8F0] p-4 sm:grid-cols-4 dark:border-white/10 dark:bg-white/5">
                  {[
                    { l: `Hardlopers: ${nHard}`, v: nHard, set: setNHard, min: 10, max: 60, step: 5 },
                    { l: `Introkorting: ${disc}%`, v: disc, set: setDisc, min: 0, max: 15, step: 1 },
                    { l: `PL ad-rate: ${plRate}%`, v: plRate, set: setPlRate, min: 0, max: 10, step: 0.5 },
                    { l: `Orders/hardloper: ${opw}`, v: opw, set: setOpw, min: 1, max: 6, step: 1 },
                  ].map((c) => (
                    <label key={c.l} className="text-xs text-[#7E7A6F]">
                      {c.l}
                      <input type="range" min={c.min} max={c.max} step={c.step} value={c.v}
                        onChange={(e) => c.set(Number(e.target.value))} className="mt-1 w-full" />
                    </label>
                  ))}
                </div>
                {plRows.length ? (
                  <Tbl head={["Categorie", "Verkoopprijs", "Marge%", "Contributie", "Intro+PL", "Orders wk1", "Investering", "PL?"]}
                    rows={plRows.map((r) => [
                      r.cat, eur2(r.asp), `${r.margin.toFixed(1)}%`, eur2(r.normC), eur2(r.introC),
                      r.orders, eur(r.inv), r.plOk ? "JA" : "NEE <25%",
                    ])} />
                ) : <Empty what="categorie-prijzen (Channable-sync)" />}
              </div>
            )}

            {section === "systeem" && (
              <Tbl head={["Pijplijn", "Status", "Detail"]}
                rows={[
                  ["eBay orders", data.orders.length ? "ACTIEF" : "WACHT", `${data.orders.length} rijen`],
                  ["eBay transacties/fees", data.transactions.length ? "ACTIEF" : "WACHT", `${data.transactions.length} rijen`],
                  ["eBay payouts", data.payouts.length ? "ACTIEF" : "WACHT", `${data.payouts.length} rijen`],
                  ["eBay traffic", data.traffic.length ? "ACTIEF" : "WACHT", `${data.traffic.length} rijen`],
                  ["Order-fout monitor", "ACTIEF", `${data.alerts.length} alerts historisch`],
                  ["Categorie-economics", data.econ.length ? "ACTIEF" : "WACHT", `${data.econ.length} rijen`],
                ]} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboards;
