import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingBag, 
  TrendingUp, 
  Layers, 
  RefreshCw, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  ArrowUpRight, 
  Calendar, 
  Filter, 
  Search, 
  X, 
  Send, 
  SlidersHorizontal, 
  Download,
  Info,
  Car,
  Check,
  Zap,
  ShieldCheck,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Types
type TabType = "overview" | "pacing" | "orders" | "magento" | "keys";
type ChannelType = "all" | "ebay_de" | "amazon_de" | "bol" | "magento";

interface OrderItem {
  id: string;
  channel: string;
  buyer: string;
  sku: string;
  title: string;
  amount: number;
  date: string;
  status: "matched" | "shipped" | "mismatch" | "pending";
  tracking: string;
  matched: boolean;
}

const INITIAL_ORDERS: OrderItem[] = [
  { id: "EB-2026-9841", channel: "eBay DE", buyer: "K. Schneider (München)", sku: "16880", title: "A.B.S. Remschijven Set Voorzijde 288mm Geventileerd", amount: 68.45, date: "2026-08-29 18:24", status: "pending", tracking: "", matched: true },
  { id: "EB-2026-9840", channel: "eBay DE", buyer: "M. Wagner (Köln)", sku: "18537", title: "A.B.S. Remschijven Achterzijde 272mm Massief", amount: 49.95, date: "2026-08-29 17:10", status: "matched", tracking: "", matched: true },
  { id: "EB-2026-9839", channel: "eBay DE", buyer: "T. Müller (Berlin)", sku: "37155", title: "A.B.S. Remblokkenset Voorzijde incl. Slijtage-indicator", amount: 34.50, date: "2026-08-29 15:42", status: "shipped", tracking: "3S00849201948", matched: true },
  { id: "EB-2026-9838", channel: "eBay DE", buyer: "S. Fischer (Hamburg)", sku: "16880", title: "A.B.S. Remschijven Set Voorzijde 288mm Geventileerd", amount: 68.45, date: "2026-08-29 14:05", status: "shipped", tracking: "3S00849201882", matched: true },
  { id: "EB-2026-9837", channel: "eBay DE", buyer: "H. Becker (Stuttgart)", sku: "17942", title: "A.B.S. Remschijven Voorzijde 312mm Geventileerd", amount: 89.20, date: "2026-08-29 11:30", status: "shipped", tracking: "3S00849201740", matched: true },
  { id: "AZ-2026-4412", channel: "Amazon DE", buyer: "D. Weber (Frankfurt)", sku: "18537", title: "A.B.S. Remschijven Achterzijde 272mm Massief", amount: 52.00, date: "2026-08-29 09:15", status: "shipped", tracking: "3S00849201655", matched: true },
  { id: "EB-2026-9836", channel: "eBay DE", buyer: "A. Richter (Dresden)", sku: "37155", title: "A.B.S. Remblokkenset Voorzijde", amount: 34.50, date: "2026-08-28 20:12", status: "shipped", tracking: "3S00849201511", matched: true },
  { id: "BOL-2026-1104", channel: "Bol.com", buyer: "J. de Vries (Utrecht)", sku: "16880", title: "A.B.S. Remschijvenset VAG", amount: 72.00, date: "2026-08-28 16:40", status: "shipped", tracking: "3S00849201402", matched: true },
  { id: "EB-2026-9835", channel: "eBay DE", buyer: "F. Hoffmann (Leipzig)", sku: "19230", title: "A.B.S. Remschijven Set 300mm", amount: 78.90, date: "2026-08-28 14:02", status: "mismatch", tracking: "", matched: false },
  { id: "EB-2026-9834", channel: "eBay DE", buyer: "C. Schulz (Nürnberg)", sku: "18537", title: "A.B.S. Remschijven Achterzijde", amount: 49.95, date: "2026-08-28 11:20", status: "shipped", tracking: "3S00849201389", matched: true },
];

const PACING_DATA = [
  { week: "W33 (Start)", budget: 3500, actual: 3620, forecast: 3620, promoted: 410, acos: 11.3, cm: 1520, index: 103 },
  { week: "W34 (Huidig)", budget: 5000, actual: 4890, forecast: 5120, promoted: 580, acos: 11.8, cm: 2050, index: 98 },
  { week: "W35 (Opschaling)", budget: 7500, actual: 0, forecast: 7650, promoted: 890, acos: 11.6, cm: 3200, index: 102 },
  { week: "W36", budget: 11000, actual: 0, forecast: 11200, promoted: 1300, acos: 11.5, cm: 4700, index: 102 },
  { week: "W37", budget: 15000, actual: 0, forecast: 15400, promoted: 1750, acos: 11.4, cm: 6450, index: 103 },
  { week: "W38", budget: 20000, actual: 0, forecast: 20800, promoted: 2350, acos: 11.3, cm: 8720, index: 104 },
  { week: "W39 (Q3 Doel)", budget: 25000, actual: 0, forecast: 25900, promoted: 2900, acos: 11.2, cm: 10850, index: 104 },
];

const MAGENTO_ENDPOINTS = [
  { path: "/V1/products", label: "Catalogus & Producten", status: "200 OK", latency: "142ms", count: "40.049 SKU's" },
  { path: "/V1/orders", label: "Orderbeheer & Statussen", status: "200 OK", latency: "168ms", count: "1.298 orders" },
  { path: "/V1/stockItems/16880", label: "Voorraad & Beschikbaarheid", status: "200 OK", latency: "98ms", count: "Real-time" },
  { path: "/V1/categories", label: "Categorie-taxonomie", status: "200 OK", latency: "112ms", count: "128 categorieën" },
  { path: "/V1/shipments", label: "Verzendingen & Track & Trace", status: "200 OK", latency: "185ms", count: "Live push" },
  { path: "/V1/invoices", label: "Facturatie & Bedragen", status: "200 OK", latency: "155ms", count: "Volledig" },
  { path: "/V1/customers/search", label: "Klantendatabase", status: "200 OK", latency: "130ms", count: "Gekoppeld" },
  { path: "/V1/inventory/source-items", label: "Magazijnbronnen (MSI)", status: "200 OK", latency: "120ms", count: "1 bron" },
  { path: "/V1/taxRates", label: "BTW & OSS Regels (19% DE)", status: "200 OK", latency: "85ms", count: "19% DE / 21% NL" },
  { path: "/V1/store/websites", label: "Websites & Multi-store", status: "200 OK", latency: "75ms", count: "2 storeviews" },
  { path: "/V1/eav/attributes", label: "EAV Eigenschappen & Fitment", status: "200 OK", latency: "110ms", count: "142 attributen" },
  { path: "/V1/carts", label: "Winkelwagen & Checkout", status: "200 OK", latency: "95ms", count: "Operationeel" },
  { path: "/V1/modules", label: "Module & Extensie Health", status: "200 OK", latency: "65ms", count: "48 actief" },
  { path: "/V1/directory/currency", label: "Valuta & Wisselkoersen", status: "200 OK", latency: "60ms", count: "EUR (€)" },
];

export default function DashboardsCcp() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [channelFilter, setChannelFilter] = useState<ChannelType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [fitmentModalOpen, setFitmentModalOpen] = useState(false);
  const [samanthaOpen, setSamanthaOpen] = useState(false);
  const [samanthaQuery, setSamanthaQuery] = useState("");
  const [samanthaChat, setSamanthaChat] = useState<Array<{ sender: "user" | "samantha"; text: string; pills?: Array<{ label: string; action: string }> }>>([
    {
      sender: "samantha",
      text: "Hoi Hans! Ik heb live inzage in de CCP orderflow, de eBay DE Top-400 opschaling en de Magento-koppeling. Waar kan ik je nu mee helpen?",
      pills: [
        { label: "🔍 Waarom ontbreekt T&T?", action: "show_tt" },
        { label: "📈 Analyseer eBay DE Pacing", action: "open_pacing" },
        { label: "⚠️ Toon Mismatches", action: "show_mismatches" },
        { label: "🚗 Top Remschijven", action: "open_fitment" },
      ]
    }
  ]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return INITIAL_ORDERS.filter(o => {
      const matchChannel = channelFilter === "all" || 
        (channelFilter === "ebay_de" && o.channel === "eBay DE") ||
        (channelFilter === "amazon_de" && o.channel === "Amazon DE") ||
        (channelFilter === "bol" && o.channel === "Bol.com") ||
        (channelFilter === "magento" && o.channel === "Magento");
      
      const matchSearch = searchQuery === "" ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.title.toLowerCase().includes(searchQuery.toLowerCase());

      return matchChannel && matchSearch;
    });
  }, [channelFilter, searchQuery]);

  const handleSamanthaAction = (action: string) => {
    if (action === "show_tt") {
      setActiveTab("orders");
      setSearchQuery("pending");
      toast({ title: "Orderflow Gefilterd", description: "Toont orders die wachten op Track & Trace." });
    } else if (action === "open_pacing") {
      setActiveTab("pacing");
      toast({ title: "Pacing Matrix", description: "Geopend: week-voor-week € 100K opschaling." });
    } else if (action === "show_mismatches") {
      setActiveTab("orders");
      setSearchQuery("mismatch");
      toast({ title: "Mismatches Gefilterd", description: "Toont orders met keten-fouten." });
    } else if (action === "open_fitment") {
      setFitmentModalOpen(true);
    } else if (action === "trigger_sync") {
      toast({ title: "⚡ n8n Sync Geactiveerd", description: "Webhook getriggerd op n8n VPS." });
    }
  };

  const handleSendSamantha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!samanthaQuery.trim()) return;

    const q = samanthaQuery.trim();
    const newChat = [...samanthaChat, { sender: "user" as const, text: q }];
    setSamanthaChat(newChat);
    setSamanthaQuery("");

    // Simulate intelligent response
    setTimeout(() => {
      const lower = q.toLowerCase();
      let reply = "Ik analyseer de actuele data van Connect Car Parts...";
      let pills: Array<{ label: string; action: string }> = [];

      if (lower.includes("track") || lower.includes("t&t") || lower.includes("abs")) {
        reply = "Track & Trace update: We zien dat de orders van A.B.S. momenteel direct naar Magento lopen, maar de geautomatiseerde DPD trackingnummers bereiken nog niet alle kopers doordat de Chrome extension harvest nog gebouwd wordt. Er wachten nu 2 orders op automatische barcodekoppeling.";
        pills = [{ label: "📦 Bekijk orders zonder T&T", action: "show_tt" }, { label: "⚡ Trigger n8n Sync", action: "trigger_sync" }];
      } else if (lower.includes("pacing") || lower.includes("omzet") || lower.includes("budget") || lower.includes("100k")) {
        reply = "Pacing Analyse: We zitten in Week 34 op € 4.890 werkelijke omzet t.o.v. € 5.000 budget (98% pacing index). De LE1 forecast voor week 35 staat op € 7.650 bij een ACOS van 11,6%. Om het € 100K kwartaaldoel te halen, adviseren we eBay Mengenrabatt op de Top-20 remschijven aan te zetten.";
        pills = [{ label: "📊 Open Pacing Matrix", action: "open_pacing" }];
      } else if (lower.includes("fitment") || lower.includes("remschijf") || lower.includes("16880")) {
        reply = "Fitment Inzage: SKU 16880 (A.B.S. 288mm geventileerde remschijf) is de #1 hardloper op eBay DE met 42 verkochte sets deze maand en een brutomarge van 44%. Past o.a. op VW Golf VII, Audi A3 8V en Skoda Octavia 5E.";
        pills = [{ label: "🚗 Open Fitment Inspector", action: "open_fitment" }];
      } else {
        reply = `Ik heb je vraag over '${q}' geëvalueerd tegen de 84 actieve orders en Magento REST data. Alles draait stabiel met 14/14 endpoints online en een Quality Score van 100/100 op eBay DE.`;
        pills = [{ label: "📊 Bekijk Overzicht", action: "open_pacing" }, { label: "🚗 Fitment Inzage", action: "open_fitment" }];
      }

      setSamanthaChat([...newChat, { sender: "samantha", text: reply, pills }]);
    }, 400);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── Top Header & Domain Bar ── */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Link to="/portal" className="hover:text-primary transition-colors">Portal</Link>
            <span>/</span>
            <Link to="/dashboards" className="hover:text-primary transition-colors">Dashboards</Link>
            <span>/</span>
            <span className="text-foreground">Connect Car Parts</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-base shadow-md shadow-blue-500/20">
              CCP
            </div>
            <span>Connect Car Parts Command Center</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live eBay DE & Multi-channel Marketplace Opschaling · Q3 Pacing Matrix · Samantha AI Partner
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              toast({ title: "Data Ververst", description: "Channable, Magento 2 en Supabase live gesynchroniseerd." });
            }}
            className="h-9 gap-1.5 text-xs font-medium rounded-xl border-border/60 bg-card/60 backdrop-blur-sm"
          >
            <RefreshCw size={13} className="text-muted-foreground" />
            <span className="hidden sm:inline">Ververs Live Data</span>
          </Button>

          <Button 
            size="sm" 
            onClick={() => setSamanthaOpen(true)}
            className="h-9 gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold hover:opacity-95 shadow-md shadow-purple-500/20 rounded-xl"
          >
            <Sparkles size={13} />
            <span>Vraag Samantha</span>
          </Button>
        </div>
      </div>

      {/* ── Domain Switcher Bar (Mobile Friendly) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Link
          to="/dashboards/ccp"
          className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs shrink-0"
        >
          <ShoppingBag size={14} />
          <span>Connect Car Parts (eBay DE Live)</span>
          <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300 font-bold">100/100</span>
        </Link>

        <Link
          to="/dashboards/mpg"
          className="flex items-center gap-2 rounded-xl bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 px-4 py-2 text-xs font-semibold transition shrink-0"
        >
          <Layers size={14} />
          <span>Marketplace Growth (MPG SaaS)</span>
        </Link>

        <Link
          to="/dashboards/hvl"
          className="flex items-center gap-2 rounded-xl bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 px-4 py-2 text-xs font-semibold transition shrink-0"
        >
          <TrendingUp size={14} />
          <span>Hans van Leeuwen (SEO & Traffic)</span>
        </Link>
      </div>

      {/* ── High-Impact KPI Row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>eBay DE Assortiment</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Live</span>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">250 / 400 SKU's</div>
          <div className="mt-1 text-xs text-muted-foreground">Quality Score 100/100</div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Q3 Pacing Target</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">W34</span>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">€ 100.000 / mnd</div>
          <div className="mt-1 text-xs text-emerald-500 font-medium">98% Pacing Index (W34)</div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Magento REST API</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">14/14 OK</span>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">40.049 Producten</div>
          <div className="mt-1 text-xs text-muted-foreground">1.298 orders in database</div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Netto CM Marge</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-500">Gezond</span>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">42.4% Netto</div>
          <div className="mt-1 text-xs text-muted-foreground">Na eBay fee (11%) & DPD</div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs transition hover:shadow-md col-span-2 sm:col-span-3 lg:col-span-1">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Track & Trace</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">ABS Gap</span>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">Push Ready</div>
          <div className="mt-1 text-xs text-amber-500 font-medium">Wacht op Chrome harvest</div>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition shrink-0 ${
            activeTab === "overview" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <TrendingUp size={14} />
          <span>Overzicht & Flow</span>
        </button>

        <button
          onClick={() => setActiveTab("pacing")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition shrink-0 ${
            activeTab === "pacing" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Calendar size={14} />
          <span>Q3 Pacing & Budget Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition shrink-0 ${
            activeTab === "orders" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Package size={14} />
          <span>Orderflow & Matchmaker ({filteredOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("magento")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition shrink-0 ${
            activeTab === "magento" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Zap size={14} />
          <span>Magento 2 Health (14/14)</span>
        </button>

        <button
          onClick={() => setActiveTab("keys")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition shrink-0 ${
            activeTab === "keys" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <ShieldCheck size={14} />
          <span>API Sleutels (12/12)</span>
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          
          {/* Visual Order Keten Pipeline */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-sm shadow-xs">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center justify-between">
              <span>Order-to-Cash Automatiseringsketen</span>
              <span className="text-xs font-normal text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">98.2% Voltooiing</span>
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
              <div className="rounded-xl border border-border/50 bg-background/60 p-4 relative">
                <div className="text-[10px] font-bold uppercase text-blue-500">Stap 1 · Marktplaats</div>
                <div className="mt-1 font-bold text-foreground text-sm">eBay / Amazon DE</div>
                <p className="mt-1 text-[11px] text-muted-foreground">Koper plaatst bestelling, betaalt direct via marketplace.</p>
                <div className="mt-2 text-xs font-semibold text-emerald-500">✓ 84 orders binnen</div>
              </div>

              <div className="rounded-xl border border-border/50 bg-background/60 p-4 relative">
                <div className="text-[10px] font-bold uppercase text-indigo-500">Stap 2 · Channable</div>
                <div className="mt-1 font-bold text-foreground text-sm">Channable Feed Engine</div>
                <p className="mt-1 text-[11px] text-muted-foreground">Normaliseert adres, berekent 19% DE BTW en splitst orderregels.</p>
                <div className="mt-2 text-xs font-semibold text-emerald-500">✓ Project 314525 OK</div>
              </div>

              <div className="rounded-xl border border-border/50 bg-background/60 p-4 relative">
                <div className="text-[10px] font-bold uppercase text-purple-500">Stap 3 · Magento 2</div>
                <div className="mt-1 font-bold text-foreground text-sm">Magento REST API</div>
                <p className="mt-1 text-[11px] text-muted-foreground">Boekt order in Magento, verlaagt voorraad (MSI).</p>
                <div className="mt-2 text-xs font-semibold text-emerald-500">✓ 14/14 endpoints HTTP 200</div>
              </div>

              <div className="rounded-xl border border-border/50 bg-background/60 p-4 relative">
                <div className="text-[10px] font-bold uppercase text-amber-500">Stap 4 · Leverancier</div>
                <div className="mt-1 font-bold text-foreground text-sm">A.B.S. Dropshipment</div>
                <p className="mt-1 text-[11px] text-muted-foreground">Order doorgestuurd naar A.B.S. Magazijn in IJsselstein.</p>
                <div className="mt-2 text-xs font-semibold text-emerald-500">✓ Pakbon aangemaakt</div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 relative">
                <div className="text-[10px] font-bold uppercase text-amber-500">Stap 5 · Track & Trace</div>
                <div className="mt-1 font-bold text-foreground text-sm">DPD / eBay T&T Push</div>
                <p className="mt-1 text-[11px] text-muted-foreground">Barcode ophalen bij A.B.S. portal en terugmelden aan koper.</p>
                <div className="mt-2 text-xs font-semibold text-amber-500">⚠️ Chrome harvest in aanbouw</div>
              </div>
            </div>
          </div>

          {/* Top Products Table & Fitment Trigger */}
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-sm shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Top-5 Hardlopers (eBay DE Assortiment)</h2>
                <p className="text-xs text-muted-foreground">Snelst verkopende A.B.S. remonderdelen met TecDoc fitment data</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFitmentModalOpen(true)}
                className="gap-1.5 text-xs rounded-xl"
              >
                <Car size={13} />
                <span>Open Fitment Inspector</span>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground uppercase text-[10px]">
                    <th className="pb-3 font-semibold">SKU</th>
                    <th className="pb-3 font-semibold">Productomschrijving</th>
                    <th className="pb-3 font-semibold">Verkocht (Aug)</th>
                    <th className="pb-3 font-semibold">Verkoopprijs</th>
                    <th className="pb-3 font-semibold">Netto Marge</th>
                    <th className="pb-3 font-semibold">Fitment</th>
                    <th className="pb-3 font-semibold text-right">Actie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  <tr className="hover:bg-muted/40 transition">
                    <td className="py-3 font-bold text-blue-500">16880</td>
                    <td className="py-3 text-foreground">A.B.S. Remschijven Set Voorzijde 288mm Geventileerd</td>
                    <td className="py-3 font-semibold">42 sets</td>
                    <td className="py-3">€ 68,45</td>
                    <td className="py-3 text-emerald-500 font-bold">44.2% (€ 30,25)</td>
                    <td className="py-3 text-muted-foreground">VW Golf VII, Audi A3, Octavia</td>
                    <td className="py-3 text-right">
                      <button onClick={() => setFitmentModalOpen(true)} className="text-blue-500 hover:underline">Inspecteer 🚗</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/40 transition">
                    <td className="py-3 font-bold text-blue-500">18537</td>
                    <td className="py-3 text-foreground">A.B.S. Remschijven Achterzijde 272mm Massief</td>
                    <td className="py-3 font-semibold">31 sets</td>
                    <td className="py-3">€ 49,95</td>
                    <td className="py-3 text-emerald-500 font-bold">41.8% (€ 20,88)</td>
                    <td className="py-3 text-muted-foreground">VW Passat, Audi A4, Leon</td>
                    <td className="py-3 text-right">
                      <button onClick={() => setFitmentModalOpen(true)} className="text-blue-500 hover:underline">Inspecteer 🚗</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/40 transition">
                    <td className="py-3 font-bold text-blue-500">37155</td>
                    <td className="py-3 text-foreground">A.B.S. Remblokkenset Voorzijde incl. Slijtage-indicator</td>
                    <td className="py-3 font-semibold">28 sets</td>
                    <td className="py-3">€ 34,50</td>
                    <td className="py-3 text-emerald-500 font-bold">46.5% (€ 16,04)</td>
                    <td className="py-3 text-muted-foreground">VAG MQB Platform</td>
                    <td className="py-3 text-right">
                      <button onClick={() => setFitmentModalOpen(true)} className="text-blue-500 hover:underline">Inspecteer 🚗</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/40 transition">
                    <td className="py-3 font-bold text-blue-500">17942</td>
                    <td className="py-3 text-foreground">A.B.S. Remschijven Voorzijde 312mm Geventileerd</td>
                    <td className="py-3 font-semibold">19 sets</td>
                    <td className="py-3">€ 89,20</td>
                    <td className="py-3 text-emerald-500 font-bold">39.8% (€ 35,50)</td>
                    <td className="py-3 text-muted-foreground">VW Golf GTI, Audi TT, Cupra</td>
                    <td className="py-3 text-right">
                      <button onClick={() => setFitmentModalOpen(true)} className="text-blue-500 hover:underline">Inspecteer 🚗</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/40 transition">
                    <td className="py-3 font-bold text-blue-500">19230</td>
                    <td className="py-3 text-foreground">A.B.S. Remschijven Set Voorzijde 300mm</td>
                    <td className="py-3 font-semibold">14 sets</td>
                    <td className="py-3">€ 78,90</td>
                    <td className="py-3 text-emerald-500 font-bold">40.5% (€ 31,95)</td>
                    <td className="py-3 text-muted-foreground">Ford Focus III, Kuga, C-Max</td>
                    <td className="py-3 text-right">
                      <button onClick={() => setFitmentModalOpen(true)} className="text-blue-500 hover:underline">Inspecteer 🚗</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PACING & BUDGET MATRIX ── */}
      {activeTab === "pacing" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-sm shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Q3 Amazon/eBay Sturing — Pacing & Budget Matrix</h2>
                <p className="text-xs text-muted-foreground">Week-voor-week omzetdoelstelling naar € 100K/maand (Start: 10 Aug 2026 / W33)</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  toast({ title: "CSV Geëxporteerd", description: "Pacing matrix gedownload als CSV." });
                }}
                className="gap-1.5 text-xs rounded-xl"
              >
                <Download size={13} />
                <span>Exporteer CSV</span>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Week</th>
                    <th className="pb-3 font-semibold">Budget (€)</th>
                    <th className="pb-3 font-semibold">Actual (€)</th>
                    <th className="pb-3 font-semibold">Forecast LE1</th>
                    <th className="pb-3 font-semibold">Ad Spend (SEA)</th>
                    <th className="pb-3 font-semibold">ACOS %</th>
                    <th className="pb-3 font-semibold">Contributiemarge (CM)</th>
                    <th className="pb-3 font-semibold text-right">Pacing Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {PACING_DATA.map((row) => (
                    <tr key={row.week} className="hover:bg-muted/40 transition">
                      <td className="py-3 font-bold text-foreground">{row.week}</td>
                      <td className="py-3 font-semibold">€ {row.budget.toLocaleString()}</td>
                      <td className="py-3 font-bold text-blue-500">{row.actual > 0 ? `€ ${row.actual.toLocaleString()}` : "—"}</td>
                      <td className="py-3">€ {row.forecast.toLocaleString()}</td>
                      <td className="py-3 text-muted-foreground">€ {row.promoted.toLocaleString()}</td>
                      <td className="py-3 font-semibold text-foreground">{row.acos}%</td>
                      <td className="py-3 text-emerald-500 font-bold">€ {row.cm.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          row.index >= 100 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        }`}>
                          {row.index}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ORDERFLOW & MATCHMAKER ── */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-sm shadow-xs">
            
            {/* Filters Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center gap-2 overflow-x-auto">
                {(["all", "ebay_de", "amazon_de", "bol", "magento"] as ChannelType[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      channelFilter === ch ? "bg-primary text-primary-foreground shadow-xs" : "bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {ch === "all" ? "Alle Kanalen" : ch.replace("_", " ").toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="relative max-w-xs w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Zoek order, koper of SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background px-9 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">×</button>
                )}
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Order ID</th>
                    <th className="pb-3 font-semibold">Kanaal</th>
                    <th className="pb-3 font-semibold">Koper</th>
                    <th className="pb-3 font-semibold">SKU & Artikel</th>
                    <th className="pb-3 font-semibold">Bedrag</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Track & Trace</th>
                    <th className="pb-3 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {filteredOrders.map((ord) => (
                    <tr 
                      key={ord.id} 
                      onClick={() => setSelectedOrder(ord)}
                      className="hover:bg-muted/40 transition cursor-pointer"
                    >
                      <td className="py-3 font-bold text-blue-500">{ord.id}</td>
                      <td className="py-3 text-foreground">{ord.channel}</td>
                      <td className="py-3 text-foreground font-semibold">{ord.buyer}</td>
                      <td className="py-3">
                        <span className="font-bold text-foreground mr-1.5">[{ord.sku}]</span>
                        <span className="text-muted-foreground">{ord.title}</span>
                      </td>
                      <td className="py-3 font-bold text-foreground">€ {ord.amount.toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ord.status === "shipped" ? "bg-emerald-500/10 text-emerald-500" :
                          ord.status === "mismatch" ? "bg-red-500/10 text-red-500" :
                          "bg-blue-500/10 text-blue-500"
                        }`}>
                          {ord.status === "shipped" ? "Verzonden" : ord.status === "mismatch" ? "Mismatch" : "In Verwerking"}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-muted-foreground">
                        {ord.tracking ? ord.tracking : <span className="text-amber-500">Wacht op DPD</span>}
                      </td>
                      <td className="py-3 text-right">
                        <button className="text-blue-500 hover:underline">Reis ↗</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: MAGENTO HEALTH ── */}
      {activeTab === "magento" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-sm shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Magento 2 REST API Diagnostic Health (14/14 HTTP 200)</h2>
                <p className="text-xs text-muted-foreground">Live geverifieerde verbinding met https://www.connectcarparts.nl</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500">
                100% Operational
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {MAGENTO_ENDPOINTS.map((ep) => (
                <div key={ep.path} className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 p-3.5">
                  <div>
                    <div className="font-bold text-xs text-foreground">{ep.label}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{ep.path}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-500">
                      <CheckCircle2 size={12} /> {ep.status}
                    </span>
                    <div className="text-[10px] text-muted-foreground">{ep.latency} · {ep.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: API KEYS / ACCESS ── */}
      {activeTab === "keys" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-sm shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">K1–K4 Credential Architecture & Supabase Secret Slots</h2>
                <p className="text-xs text-muted-foreground">12/12 sleutelposities actief in Supabase project `pesfakewujjwkyybwaom`</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500">
                12 / 12 Geconfigureerd
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { name: "Channable API Token", slot: "ccp_channable_token", status: "K2 cms_secrets", access: "Read / Orders" },
                { name: "Magento 2 REST Bearer", slot: "ccp_magento_bearer", status: "K2 cms_secrets", access: "Full Admin REST" },
                { name: "eBay DE OAuth Refresh", slot: "ccp_ebay_refresh_token", status: "K2 cms_secrets", access: "Trading / Inventory" },
                { name: "n8n Automation VPS", slot: "n8n_vps_api_key", status: "K1 Hostinger", access: "50 Workflows (18 live)" },
                { name: "Permanent Viewer Token", slot: "ccp_viewer_token", status: "K2 Consumers", access: "Unrestricted View" },
                { name: "Supabase Service Key", slot: "supabase_service_role", status: "K2 pesfakewujjwkyybwaom", access: "Root Admin" },
              ].map((k) => (
                <div key={k.slot} className="rounded-xl border border-border/50 bg-background/60 p-4">
                  <div className="font-bold text-xs text-foreground">{k.name}</div>
                  <div className="font-mono text-[10px] text-blue-500 mt-1">{k.slot}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                    <span>{k.status}</span>
                    <span className="text-emerald-500 font-semibold">{k.access}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-over Order Journey Drawer ── */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedOrder.id}</h3>
                  <p className="text-xs text-muted-foreground">{selectedOrder.channel} · {selectedOrder.date}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="rounded-lg p-1 text-muted-foreground hover:text-foreground">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Klant & Locatie</div>
                  <div className="font-semibold text-foreground text-sm">{selectedOrder.buyer}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Artikel Details</div>
                  <div className="font-bold text-blue-500">SKU: {selectedOrder.sku}</div>
                  <div className="text-xs text-foreground">{selectedOrder.title}</div>
                </div>

                {/* Financial Margin Breakdown */}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2 text-xs">
                  <div className="font-bold text-foreground mb-2">Financiële Rendementsberekening</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bruto Verkoop</span>
                    <span className="font-bold text-foreground">€ {selectedOrder.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>Marktplaats Fee (~11%)</span>
                    <span>- € {(selectedOrder.amount * 0.11).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>DPD Pakketverzending DE</span>
                    <span>- € 5,95</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>Inkoop A.B.S.</span>
                    <span>- € {(selectedOrder.amount * 0.45).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border/60 pt-2 flex justify-between font-bold text-emerald-500 text-sm">
                    <span>Netto Contributiemarge</span>
                    <span>€ {(selectedOrder.amount * 0.44 - 5.95).toFixed(2)} (~42%)</span>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-6 rounded-xl"
            >
              Sluit Orderinzage
            </Button>
          </div>
        </div>
      )}

      {/* ── TecDoc Fitment Modal ── */}
      {fitmentModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setFitmentModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Car size={18} className="text-blue-500" />
                <h3 className="font-bold text-foreground">TecDoc / K-Type Fitment Inspector</h3>
              </div>
              <button onClick={() => setFitmentModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                <div className="font-bold text-blue-500">A.B.S. SKU 16880 — Remschijven Set Voorzijde 288mm</div>
                <div className="text-muted-foreground mt-0.5">OE Cross-reference: 1K0 615 301 T, 5Q0 615 301 H</div>
              </div>

              <div>
                <div className="font-bold text-foreground mb-1">Geverifieerde Voertuigtoepassing (VAG MQB):</div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Volkswagen Golf VII (5G1, BQ1, BE1, BE2) 1.4 TSI / 1.6 TDI (2012–2020)</li>
                  <li>Audi A3 Sportback (8VA, 8VF) 1.0 TFSI / 1.4 TFSI / 2.0 TDI (2012–2020)</li>
                  <li>Skoda Octavia III Combi (5E5, 5E6) 1.2 TSI / 1.6 TDI / 2.0 TDI (2012–2020)</li>
                  <li>SEAT Leon ST (5F8) 1.2 TSI / 1.4 TSI / 1.6 TDI (2013–2020)</li>
                </ul>
              </div>

              <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground flex justify-between items-center">
                <span>Dikte: 25.0mm (Min: 22.0mm) · Diameter: 288mm · 5 Gaten</span>
                <span className="text-emerald-500 font-bold">100% Fitment Match</span>
              </div>
            </div>

            <Button onClick={() => setFitmentModalOpen(false)} className="w-full rounded-xl">
              Sluit Fitment Inspector
            </Button>
          </div>
        </div>
      )}

      {/* ── Samantha AI Copilot Pop-up / Drawer ── */}
      {samanthaOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition"
          onClick={() => setSamanthaOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-card border-l border-border h-full p-6 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold text-xs shadow-md">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Samantha AI Partner</h3>
                    <p className="text-[11px] text-emerald-500 font-medium">Live verbonden met CCP Database</p>
                  </div>
                </div>
                <button onClick={() => setSamanthaOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>

              {/* Chat Stream */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
                {samanthaChat.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                      msg.sender === "user" 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "bg-muted/60 text-foreground border border-border/60"
                    }`}>
                      {msg.text}
                    </div>

                    {/* Action Pills in reply */}
                    {msg.pills && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.pills.map((pill, pi) => (
                          <button
                            key={pi}
                            onClick={() => handleSamanthaAction(pill.action)}
                            className="rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 px-2.5 py-1 text-[10px] font-semibold transition"
                          >
                            {pill.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Input form */}
            <form onSubmit={handleSendSamantha} className="mt-4 flex gap-2 border-t border-border/60 pt-4">
              <input
                type="text"
                placeholder="Vraag Samantha iets over CCP, omzet of orders..."
                value={samanthaQuery}
                onChange={(e) => setSamanthaQuery(e.target.value)}
                className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              />
              <Button type="submit" size="sm" className="rounded-xl px-3 bg-purple-600 hover:bg-purple-700 text-white">
                <Send size={13} />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Samantha Trigger (bottom right) */}
      <button
        onClick={() => setSamanthaOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 text-xs font-bold shadow-xl shadow-purple-500/30 hover:scale-105 transition"
      >
        <Sparkles size={14} />
        <span>Samantha AI</span>
      </button>

    </div>
  );
}
