// Rule-based insights for /dashboards/hvl: every insight names the evidence and the next action.
// Deterministic on purpose: the same data always gives the same advice, and each rule is tested
// (siteInsights.test.ts). Thresholds are sized for a low-traffic B2B site, where a handful of
// visits is already a signal but a percentage swing on 3 visits is not.

export interface Kpis {
  visits?: number; pageviews?: number; engaged?: number; intent?: number; leads?: number; submissions?: number;
  avg_engaged_s?: number | null;
  search_clicks?: number | null; search_impressions?: number | null; search_ctr?: number | null; search_position?: number | null;
  search_last_day?: string | null; ga4_sessions?: number | null; ga4_engaged?: number | null; ga4_last_day?: string | null;
}
export interface PageRow {
  path: string; views: number; visits: number; avg_engaged_s: number | null; avg_scroll: number | null;
  intent_rate: number | null; clicks: number | null; impressions: number | null; position: number | null;
}
export interface QueryRowD { query: string; clicks: number; impressions: number; position: number | null; prev_position: number | null }
export interface ChannelRow { channel: string; visits: number; engaged: number; leads: number }
export interface VitalRow { metric: string; device: string; p75: number; n: number; good_pct: number }
export interface ChangeResult {
  verdict: "win" | "loss" | "flat" | "measuring" | "insufficient" | "no_baseline";
  lift_pct: number | null; abs_change: number | null; confidence: number | null; note: string;
  treated: { pre: number | null; post: number | null };
  windows: { post: { days: number }; planned_post_to: string };
}
export interface ChangeRow {
  id: string; title: string; kind: string; linear_issue: string | null; pr_number: number | null; deployed_at: string | null;
  paths: string[]; primary_metric: string | null; expected: "up" | "down"; hypothesis: string | null;
  measure_days: number; status: string; result: ChangeResult | null; result_at: string | null;
}
export interface IndexingIssue { url: string; verdict: string; coverage_state: string | null; last_crawl: string | null }
export interface SiteDashboard {
  period: { from: string; to: string; prev_from: string | null; prev_to: string | null };
  kpi: { cur: Kpis; prev: Kpis | null };
  funnel: { visits: number; engaged: number; intent: number; form_start: number; lead: number; form_submit: number; book: number; email: number; linkedin: number };
  series: { d: string; visits: number; leads: number; clicks: number | null; impressions: number | null; position: number | null; ga4_sessions: number | null }[] | null;
  pages: PageRow[] | null; channels: ChannelRow[] | null; landing: { path: string; visits: number; engaged: number; leads: number; avg_engaged_s: number | null }[] | null;
  devices: { device: string; visits: number; engaged: number; leads: number }[] | null;
  queries: QueryRowD[] | null; vitals: VitalRow[] | null; vitals_pages: { path: string; metric: string; p75: number; n: number }[] | null;
  errors: { not_found: { path: string; n: number }[] | null; js: { message: string; path: string; n: number }[] | null } | null;
  events: Record<string, number> | null; changes: ChangeRow[] | null;
  submissions: { created_at: string; name: string; email: string; reason: string; lang: string | null; page: string | null; message: string }[] | null;
  coverage: { indexing?: { data?: { checked: number; total: number; issues: IndexingIssue[] } | null; fetched_at?: string | null } | null } | null;
  harvest: { at: string; data: { sitemap?: string; errors?: Record<string, string>; complete?: boolean } } | null;
  quality: { last_event: string | null; internal_events: number; tracking_since: string | null; gsc_since: string | null; ga4_since: string | null };
}

export type Severity = "critical" | "high" | "medium" | "win" | "info";
export interface Insight { id: string; severity: Severity; area: string; title: string; evidence: string; action: string }

const ORDER: Record<Severity, number> = { critical: 0, high: 1, win: 2, medium: 3, info: 4 };
export const MONEY_PAGES = /^\/(nl\/)?(interim-ecommerce-manager|amazon-nl-specialist|bol-com-consultant|ai-ecommerce-automation|rates|tarieven)\/?$/;

const pathOf = (u: string) => { try { return new URL(u).pathname; } catch { return u; } };
const pct = (a: number, b: number) => (b > 0 ? Math.round((1000 * a) / b) / 10 : 0);
const days = (a: string, b: Date) => Math.floor((b.getTime() - new Date(a).getTime()) / 86_400_000);
const list = (xs: string[], n = 3) => xs.slice(0, n).join(", ") + (xs.length > n ? ` en ${xs.length - n} meer` : "");

export function buildInsights(d: SiteDashboard, now = new Date()): Insight[] {
  const out: Insight[] = [];
  const k = d.kpi.cur;
  const add = (i: Insight) => out.push(i);

  // ---- indexing ----
  const issues = d.coverage?.indexing?.data?.issues ?? [];
  if (issues.length) {
    const money = issues.filter((i) => MONEY_PAGES.test(pathOf(i.url)));
    const unknown = issues.filter((i) => /unknown to google/i.test(i.coverage_state ?? ""));
    add({
      id: "indexing", severity: money.length ? "critical" : "high", area: "Indexatie",
      title: money.length
        ? `${money.length} geldpagina${money.length === 1 ? "" : "'s"} niet in Google`
        : `${issues.length} sitemap-URL's niet in Google`,
      evidence: `${issues.length} van ${d.coverage?.indexing?.data?.total ?? "?"} URL's niet geïndexeerd (${unknown.length} onbekend bij Google, ${issues.length - unknown.length} gecrawld maar niet opgenomen): ${list((money.length ? money : issues).map((i) => pathOf(i.url)))}.`,
      action: unknown.length
        ? "Vraag indexering aan via URL-inspectie in Search Console en link deze pagina's vanaf de homepage en de dienstenpagina's."
        : "Gecrawld maar niet opgenomen betekent: Google vindt de pagina te dun of te gelijk. Maak de inhoud unieker en voeg interne links toe.",
    });
  }
  const sm = d.harvest?.data?.sitemap ?? "";
  if (sm.startsWith("missing")) {
    add({ id: "sitemap", severity: "critical", area: "Indexatie", title: "Geen sitemap in Search Console", evidence: sm.replace(/^missing:\s*/, ""), action: "Dien https://hansvanleeuwen.com/sitemap.xml in via Search Console > Sitemaps." });
  } else if (sm.startsWith("submitted")) {
    add({ id: "sitemap", severity: "win", area: "Indexatie", title: "Sitemap automatisch ingediend", evidence: "Search Console had geen sitemap; de dagelijkse oogst heeft /sitemap.xml ingediend.", action: "Geen actie: indexatie van nieuwe pagina's volgt nu sneller. Controleer over een week het aantal geïndexeerde pagina's." });
  }

  // ---- conversion ----
  const f = d.funnel;
  if (f.form_start >= 2 && f.form_submit / f.form_start < 0.5) {
    add({
      id: "form-dropoff", severity: "high", area: "Conversie", title: "Contactformulier lekt",
      evidence: `${f.form_start} bezoekers begonnen aan het formulier, ${f.form_submit} verstuurden het (${pct(f.form_submit, f.form_start)}%).`,
      action: "Verkort het formulier (reden-veld optioneel), toon direct de Calendly-link als alternatief en test de verzendknop op mobiel.",
    });
  }
  if ((k.visits ?? 0) >= 30 && (k.leads ?? 0) === 0) {
    add({
      id: "no-leads", severity: "high", area: "Conversie", title: "Bezoek zonder aanvragen",
      evidence: `${k.visits} bezoeken, ${k.intent ?? 0} met interesse (klik op contact, tarieven, LinkedIn), 0 leads.`,
      action: "Zet op elke dienstenpagina boven de vouw één primaire actie (Plan 30-min gesprek) en herhaal die onderaan.",
    });
  }
  const prev = d.kpi.prev;
  if (prev && (prev.leads ?? 0) + (k.leads ?? 0) >= 4) {
    const a = k.leads ?? 0, b = prev.leads ?? 0;
    if (a > b * 1.5) add({ id: "leads-up", severity: "win", area: "Conversie", title: `Leads stijgen: ${a} tegen ${b}`, evidence: "Meer leadacties (formulier, gesprek, e-mail, LinkedIn) dan de vorige periode.", action: "Kijk in 'Verbeteringen' welke wijziging dit verklaart en pas die toe op de andere dienstenpagina's." });
    if (b > a * 1.5) add({ id: "leads-down", severity: "high", area: "Conversie", title: `Leads dalen: ${a} tegen ${b}`, evidence: "Minder leadacties dan de vorige periode.", action: "Controleer of het formulier werkt en of een recente wijziging de CTA's heeft verplaatst." });
  }

  // ---- pages ----
  for (const p of d.pages ?? []) {
    if (p.views >= 10 && p.avg_engaged_s != null && p.avg_engaged_s < 8) {
      add({ id: `bounce:${p.path}`, severity: "medium", area: "Pagina", title: `${p.path}: bezoekers haken snel af`, evidence: `${p.views} weergaven, gemiddeld ${p.avg_engaged_s}s actief.`, action: "De pagina beantwoordt de zoekvraag niet snel genoeg: zet de kern en het bewijs in de eerste alinea." });
    }
    if (p.visits >= 8 && (p.avg_scroll ?? 0) >= 60 && (p.intent_rate ?? 0) === 0) {
      add({ id: `nocta:${p.path}`, severity: "medium", area: "Pagina", title: `${p.path}: gelezen, geen vervolgstap`, evidence: `${p.visits} bezoeken, ${p.avg_scroll}% gescrold, 0% klikt door naar contact of tarieven.`, action: "Voeg aan het eind een concrete volgende stap toe (gesprek plannen of de passende dienstenpagina)." });
    }
    if ((p.impressions ?? 0) >= 50 && (p.position ?? 99) <= 12 && pct(p.clicks ?? 0, p.impressions ?? 0) < 1.5) {
      add({ id: `ctr:${p.path}`, severity: "medium", area: "Zoeken", title: `${p.path}: zichtbaar, maar er wordt niet geklikt`, evidence: `${p.impressions} vertoningen op positie ${p.position}, CTR ${pct(p.clicks ?? 0, p.impressions ?? 0)}%.`, action: "Herschrijf title en meta description rond de zoekvraag, met een concreet voordeel of getal." });
    }
  }

  // ---- queries: striking distance ----
  const striking = (d.queries ?? []).filter((q) => q.impressions >= 10 && (q.position ?? 0) > 8 && (q.position ?? 99) <= 20);
  if (striking.length) {
    add({
      id: "striking", severity: "medium", area: "Zoeken", title: `${striking.length} zoekopdracht${striking.length === 1 ? "" : "en"} net buiten pagina 1`,
      evidence: striking.slice(0, 4).map((q) => `"${q.query}" (pos. ${q.position}, ${q.impressions} vert.)`).join(", "),
      action: "Geef elke zoekopdracht een eigen sectie of artikel en link ernaar vanaf de best rankende pagina.",
    });
  }
  const climbers = (d.queries ?? []).filter((q) => q.prev_position != null && q.position != null && q.prev_position - q.position >= 3 && q.impressions >= 5);
  if (climbers.length) {
    add({ id: "climbers", severity: "win", area: "Zoeken", title: `${climbers.length} zoekopdracht${climbers.length === 1 ? "" : "en"} flink gestegen`, evidence: climbers.slice(0, 4).map((q) => `"${q.query}" ${q.prev_position} naar ${q.position}`).join(", "), action: "Versterk wat werkt: interne links naar de rankende pagina en een FAQ-blok op die zoekvraag." });
  }

  // ---- technical ----
  const worst = (m: string) => (d.vitals ?? []).filter((v) => v.metric === m && v.n >= 3).sort((a, b) => b.p75 - a.p75)[0];
  const lcp = worst("LCP"), inp = worst("INP"), cls = worst("CLS");
  if (lcp && lcp.p75 > 2500) add({ id: "lcp", severity: lcp.p75 > 4000 ? "high" : "medium", area: "Snelheid", title: `Laadtijd (LCP) ${(lcp.p75 / 1000).toFixed(1)}s op ${lcp.device}`, evidence: `75e percentiel over ${lcp.n} metingen; goed is onder 2,5s.`, action: "Verklein en preload de hero-afbeelding, en stel niet-kritische scripts (GTM, fonts) uit." });
  if (inp && inp.p75 > 200) add({ id: "inp", severity: inp.p75 > 500 ? "high" : "medium", area: "Snelheid", title: `Reactietijd (INP) ${Math.round(inp.p75)}ms op ${inp.device}`, evidence: `75e percentiel over ${inp.n} metingen; goed is onder 200ms.`, action: "Zoek de trage handler (vaak animaties of een grote re-render na een klik) en splits het werk op." });
  if (cls && cls.p75 > 0.1) add({ id: "cls", severity: cls.p75 > 0.25 ? "high" : "medium", area: "Snelheid", title: `Verspringende layout (CLS ${cls.p75}) op ${cls.device}`, evidence: `75e percentiel over ${cls.n} metingen; goed is onder 0,1.`, action: "Geef afbeeldingen en embeds vaste afmetingen en reserveer ruimte voor de cookiebanner." });
  const nf = d.errors?.not_found ?? [];
  if (nf.length) add({ id: "404", severity: "medium", area: "Techniek", title: `${nf.reduce((s, x) => s + x.n, 0)} bezoeken op niet-bestaande pagina's`, evidence: list(nf.map((x) => `${x.path} (${x.n})`)), action: "Maak een redirect naar de juiste pagina (vercel.json) of herstel de link die ernaar verwijst." });
  const js = d.errors?.js ?? [];
  if (js.length) add({ id: "js", severity: "medium", area: "Techniek", title: `${js.reduce((s, x) => s + x.n, 0)} JavaScript-fouten bij bezoekers`, evidence: list(js.map((x) => `"${x.message.slice(0, 60)}" op ${x.path}`), 2), action: "Reproduceer de fout op de genoemde pagina en los hem op voordat hij conversies kost." });

  // ---- improvements ----
  for (const c of d.changes ?? []) {
    const r = c.result;
    if (!r) continue;
    if (r.verdict === "win") add({ id: `win:${c.id}`, severity: "win", area: "Verbeteringen", title: `Werkt: ${c.title}`, evidence: `${r.lift_pct != null ? `${r.lift_pct > 0 ? "+" : ""}${r.lift_pct}%` : ""} op ${label(c.primary_metric)} ten opzichte van de rest van de site (${Math.round((r.confidence ?? 0) * 100)}% zekerheid).`, action: "Pas hetzelfde principe toe op vergelijkbare pagina's en leg het vast als standaard." });
    if (r.verdict === "loss") add({ id: `loss:${c.id}`, severity: "high", area: "Verbeteringen", title: `Averechts: ${c.title}`, evidence: `${r.lift_pct != null ? `${r.lift_pct}%` : ""} op ${label(c.primary_metric)} ten opzichte van de rest van de site.`, action: "Draai de wijziging (deels) terug of stuur bij, en meet opnieuw." });
  }
  const unmeasured = (d.changes ?? []).filter((c) => c.status === "planned").length;
  if (unmeasured) add({ id: "planned", severity: "info", area: "Verbeteringen", title: `${unmeasured} geplande verbeteringen klaar om te meten`, evidence: "Elke PR die het Linear-nummer noemt, start automatisch de voor- en nameting.", action: "Noem het HAN-nummer in de PR-titel of -tekst; een Measure-regel in de PR stuurt metriek en pagina's." });

  // ---- data quality ----
  const since = d.quality.tracking_since;
  if (!since) {
    add({ id: "tracking-none", severity: "info", area: "Meting", title: "Eigen bezoekmeting nog zonder data", evidence: "De first-party meting (zonder cookies) is gebouwd; data verschijnt zodra de site met deze versie live staat.", action: "Geen actie nodig. Zoek- en GA4-data hieronder zijn al wel historisch gevuld." });
  } else if (days(since, now) < 14) {
    add({ id: "tracking-young", severity: "info", area: "Meting", title: `Eigen bezoekmeting loopt ${Math.max(1, days(since, now))} dag(en)`, evidence: "Vergelijkingen met de vorige periode tellen pas na twee volle weken.", action: "Geen actie; beoordeel bezoek en conversie vanaf twee weken meetdata." });
  }
  if ((k.visits ?? 0) >= 20 && k.ga4_sessions != null) {
    const share = pct(k.ga4_sessions, k.visits ?? 0);
    if (share < 60) add({ id: "ga4-gap", severity: "info", area: "Meting", title: `GA4 ziet ${share}% van de bezoeken`, evidence: `${k.ga4_sessions} GA4-sessies tegen ${k.visits} eigen gemeten bezoeken: de rest weigert of negeert cookies.`, action: "Stuur op de eigen meting; gebruik GA4 alleen voor verhoudingen, niet voor absolute aantallen." });
  }
  return out.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}

export function label(metric: string | null): string {
  return ({
    search_clicks: "zoekklikken", search_impressions: "zoekvertoningen", search_ctr: "CTR", search_position: "positie",
    visits: "bezoeken", engaged_rate: "betrokkenheid", leads: "leads", lead_rate: "leadconversie",
  } as Record<string, string>)[metric ?? ""] ?? "geen metriek";
}
