import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3, Package, TrendingUp, Search, Euro, Percent, Gauge, Settings2, LogIn, Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

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
        <p className="mb-5 text-sm text-[#7E7A6F]">ConnectCarParts · eBay DE · live uit Supabase</p>

        {err && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Fout bij laden: {err}</p>}
        {!data && !err && <p className="text-sm text-[#7E7A6F]">Laden…</p>}

        {data && agg && (
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
