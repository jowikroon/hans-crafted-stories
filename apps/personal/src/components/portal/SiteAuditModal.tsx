import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Globe, AlertTriangle, CheckCircle, Loader2,
  History, ChevronRight, Trash2, BarChart3, Clock,
  ExternalLink, FolderOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { portalApi, SiteAuditResult } from "@/lib/api/portal";
import {
  SeoAudit, saveAudit, getAuditDomains, getAuditsByDomain, getAuditHistory,
  deleteAudit, extractDomain, computeSeoScore, categorizePath, normalizeUrl, countTodaysScans,
} from "@/lib/api/seoAudits";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const DAILY_SCAN_LIMIT = 10;
const CATEGORY_ORDER = ["homepage", "blog", "product", "category", "about", "contact", "legal", "other"];

/** Tiny inline score-trend sparkline (chronological, last 20 scans) */
function ScoreSparkline({ audits }: { audits: SeoAudit[] }) {
  const points = [...audits]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-20)
    .map((a) => a.seo_score);
  if (points.length < 2) return null;
  const w = 120, h = 28, pad = 2;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const coords = points
    .map((v, i) => `${pad + (i * (w - 2 * pad)) / (points.length - 1)},${h - pad - ((v - min) * (h - 2 * pad)) / range}`)
    .join(" ");
  const up = points[points.length - 1] >= points[0];
  return (
    <svg width={w} height={h} className="shrink-0" aria-label="Score trend">
      <polyline points={coords} fill="none" strokeWidth="1.5" className={up ? "stroke-emerald-500" : "stroke-red-500"} />
    </svg>
  );
}

interface SiteAuditModalProps {
  open: boolean;
  onClose: () => void;
}

type View = "audit" | "history";

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : score >= 50 ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
    : "text-red-500 bg-red-500/10 border-red-500/20";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums ${color}`}>
      {score}
    </span>
  );
}

function relTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

const SiteAuditModal = ({ open, onClose }: SiteAuditModalProps) => {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SiteAuditResult | null>(null);
  const [savedAudit, setSavedAudit] = useState<SeoAudit | null>(null);
  const [prevAudit, setPrevAudit] = useState<SeoAudit | null>(null);
  const { toast } = useToast();

  const [view, setView] = useState<View>("audit");
  const [domains, setDomains] = useState<{ domain: string; count: number; latest: string }[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [domainAudits, setDomainAudits] = useState<SeoAudit[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadDomains = useCallback(async () => {
    try { setDomains(await getAuditDomains()); } catch { /* silent */ }
  }, []);

  useEffect(() => { if (open) loadDomains(); }, [open, loadDomains]);

  const loadDomainAudits = async (domain: string) => {
    setSelectedDomain(domain);
    setLoadingHistory(true);
    try { setDomainAudits(await getAuditsByDomain(domain)); }
    catch (e: unknown) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoadingHistory(false); }
  };

  const handleDeleteAudit = async (id: string) => {
    if (!confirm("Delete this audit?")) return;
    try {
      await deleteAudit(id);
      toast({ title: "Audit deleted" });
      if (selectedDomain) loadDomainAudits(selectedDomain);
      loadDomains();
    } catch (e: unknown) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const viewSavedAudit = (audit: SeoAudit) => {
    setResult({
      url: audit.url, title: audit.title, titleLength: audit.title_length,
      metaDescription: audit.meta_description, metaDescriptionLength: audit.meta_description_length,
      headings: audit.headings || [], h1Count: audit.h1_count,
      totalLinks: audit.total_links, totalImages: audit.total_images,
      imagesWithoutAlt: audit.images_without_alt, wordCount: audit.word_count, issues: audit.issues || [],
    });
    setSavedAudit(audit);
    setUrl(audit.url);
    setView("audit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (user) {
      const used = await countTodaysScans(user.id);
      if (used >= DAILY_SCAN_LIMIT) {
        toast({ title: "Daily limit reached", description: `Max ${DAILY_SCAN_LIMIT} scans per day. Try again tomorrow.`, variant: "destructive" });
        return;
      }
    }
    const norm = normalizeUrl(url);
    setLoading(true); setResult(null); setSavedAudit(null); setPrevAudit(null);
    try {
      const res = await portalApi.runSiteAudit(norm.url);
      if (res.success && res.data) {
        setResult(res.data);
        const domain = norm.domain;
        const path = norm.path;
        const scores = computeSeoScore(res.data);
        try {
          const saved = await saveAudit({
            url: norm.url, domain, path,
            title: res.data.title || "", title_length: res.data.titleLength || 0,
            meta_description: res.data.metaDescription || "", meta_description_length: res.data.metaDescriptionLength || 0,
            h1_count: res.data.h1Count || 0, headings: res.data.headings || [],
            total_links: res.data.totalLinks || 0, total_images: res.data.totalImages || 0,
            images_without_alt: res.data.imagesWithoutAlt || 0, word_count: res.data.wordCount || 0,
            issues: res.data.issues || [], seo_score: scores.score,
            critical_count: scores.critical, warning_count: scores.warning, passed_count: scores.passed,
            technical_audit: "", content_audit: "", audited_by: "portal",
            category: categorizePath(path),
            requested_by: user?.id ?? null,
          });
          setSavedAudit(saved);
          try {
            const hist = await getAuditHistory(domain, path);
            setPrevAudit(hist.find((h) => h.id !== saved.id) ?? null);
          } catch { /* silent — diff is a bonus */ }
          loadDomains();
          toast({ title: "Audit saved", description: `Stored under ${domain}` });
        } catch (saveErr: unknown) { console.error("Failed to save audit:", saveErr); }
      } else {
        const msg = res.error || "Unknown error";
        const blocked = /403|401|robot|blocked|denied|forbidden|captcha/i.test(msg);
        toast({
          title: blocked ? "Site blocks the scanner" : "Audit failed",
          description: blocked ? "This site refuses automated crawlers (robots/403). Nothing was saved." : msg,
          variant: "destructive",
        });
      }
    } catch { toast({ title: "Error", description: "Failed to run audit", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}>

            <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X size={20} /></button>

            {/* Header */}
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <Globe size={20} className="text-green-500" />
                <h2 className="font-display text-xl font-medium">Site Audit</h2>
                <div className="flex-1" />
                <div className="flex rounded-lg border border-border/60 bg-secondary/20 p-0.5">
                  <button onClick={() => setView("audit")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${view === "audit" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-muted-foreground"}`}>
                    <BarChart3 size={12} /> Audit
                  </button>
                  <button onClick={() => { setView("history"); loadDomains(); }}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${view === "history" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-muted-foreground"}`}>
                    <History size={12} /> History
                    {domains.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[9px]">{domains.reduce((s, d) => s + d.count, 0)}</Badge>}
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {view === "audit" ? "Run a quick SEO audit — results are saved automatically by domain" : "Browse saved audits grouped by domain"}
              </p>
            </div>

            {/* ═══ AUDIT VIEW ═══ */}
            {view === "audit" && (<>
              <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
                <Input type="text" placeholder="https://hansvanleeuwen.com/writing/seo-guide" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" />
                <Button type="submit" disabled={loading} className="shrink-0">{loading ? <Loader2 size={16} className="animate-spin" /> : "Audit"}</Button>
              </form>

              {!loading && !result && url.trim() && (() => {
                const typed = extractDomain(url);
                const known = domains.find((d) => d.domain === typed);
                if (!known) return null;
                return (
                  <button type="button" onClick={() => { setView("history"); loadDomainAudits(known.domain); }}
                    className="mb-4 flex w-full items-center gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground">
                    <FolderOpen size={13} className="shrink-0" />
                    <span><span className="font-medium text-foreground">{known.domain}</span> was scanned before — {known.count} audit{known.count !== 1 ? "s" : ""}, last {relTime(known.latest)}</span>
                    <ChevronRight size={13} className="ml-auto shrink-0" />
                  </button>
                );
              })()}

              {loading && (<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground"><Loader2 size={28} className="animate-spin" /><p className="text-sm">Crawling and analyzing…</p></div>)}

              {result && (
                <div className="space-y-6">
                  {savedAudit && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs">
                      <CheckCircle size={13} className="text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Saved to {savedAudit.domain}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <ScoreBadge score={savedAudit.seo_score} />
                      <span className="text-muted-foreground/50">{savedAudit.critical_count} critical · {savedAudit.warning_count} warnings · {savedAudit.passed_count} passed</span>
                    </div>
                  )}

                  {savedAudit && prevAudit && (() => {
                    const delta = savedAudit.seo_score - prevAudit.seo_score;
                    const prevIssues = (prevAudit.issues || []) as string[];
                    const curIssues = (savedAudit.issues || []) as string[];
                    const resolved = prevIssues.filter((i) => !curIssues.includes(i)).length;
                    const added = curIssues.filter((i) => !prevIssues.includes(i)).length;
                    return (
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                        <History size={13} className="text-muted-foreground" />
                        <span className="font-medium text-foreground">vs previous scan ({relTime(prevAudit.created_at)})</span>
                        <span className={`font-semibold tabular-nums ${delta > 0 ? "text-emerald-500" : delta < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                          {delta > 0 ? "+" : ""}{delta} score
                        </span>
                        {resolved > 0 && <span className="text-emerald-500">{resolved} issue{resolved !== 1 ? "s" : ""} resolved</span>}
                        {added > 0 && <span className="text-red-500">{added} new issue{added !== 1 ? "s" : ""}</span>}
                        {resolved === 0 && added === 0 && <span className="text-muted-foreground/60">same issues as before</span>}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[{ label: "Words", value: result.wordCount }, { label: "Links", value: result.totalLinks }, { label: "Images", value: result.totalImages }, { label: "Issues", value: result.issues.length }].map((s) => (
                      <div key={s.label} className="rounded-lg border border-border p-3 text-center">
                        <p className="text-2xl font-semibold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg border border-border p-4">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Title ({result.titleLength} chars)</p>
                      <p className="text-sm text-foreground">{result.title || "—"}</p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Meta Description ({result.metaDescriptionLength} chars)</p>
                      <p className="text-sm text-foreground">{result.metaDescription || "—"}</p>
                    </div>
                  </div>

                  {result.issues.length > 0 ? (
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-foreground">Issues Found</h3>
                      <ul className="space-y-1">
                        {result.issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-orange-500" />
                            <span className="text-muted-foreground">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-green-500"><CheckCircle size={14} /> No major issues found</div>
                  )}

                  {result.headings.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-foreground">Headings Structure</h3>
                      <div className="max-h-48 space-y-1 overflow-y-auto">
                        {result.headings.slice(0, 20).map((h, i) => (
                          <div key={i} className="flex items-baseline gap-2 text-sm">
                            <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-xs font-mono font-medium text-secondary-foreground">{h.tag}</span>
                            <span className="truncate text-muted-foreground">{h.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>)}

            {/* ═══ HISTORY VIEW ═══ */}
            {view === "history" && (
              <div className="space-y-4">
                {!selectedDomain ? (
                  domains.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                      <FolderOpen size={32} className="mb-3 text-muted-foreground/20" />
                      <p className="text-sm text-muted-foreground">No audits saved yet.</p>
                      <p className="mt-1 text-xs text-muted-foreground/50">Run an audit to start tracking SEO.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {domains.map((d) => (
                        <button key={d.domain} onClick={() => loadDomainAudits(d.domain)}
                          className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card/50 p-4 text-left transition-all hover:border-primary/30">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15">
                            <Globe size={18} className="text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-foreground">{d.domain}</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">{d.count} audit{d.count !== 1 ? "s" : ""} · last {relTime(d.latest)}</p>
                          </div>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">{d.count}</Badge>
                          <ChevronRight size={14} className="shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => setSelectedDomain(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← All domains</button>
                      <ChevronRight size={11} className="text-muted-foreground/30" />
                      <span className="text-xs font-semibold text-foreground">{selectedDomain}</span>
                      <Badge variant="secondary" className="text-[10px]">{domainAudits.length}</Badge>
                    </div>

                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
                    ) : domainAudits.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">No audits for this domain.</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Domein-dashboard: trend + kerncijfers */}
                        <div className="flex items-center gap-4 rounded-lg border border-border bg-card/30 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Score trend</p>
                            <div className="mt-1 flex items-center gap-3">
                              <ScoreSparkline audits={domainAudits} />
                              <ScoreBadge score={domainAudits[0].seo_score} />
                              <span className="text-[10px] text-muted-foreground/60">latest</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-semibold tabular-nums text-foreground">{[...new Set(domainAudits.map((x) => x.path))].length}</p>
                            <p className="text-[10px] text-muted-foreground/60">pages tracked</p>
                          </div>
                        </div>

                        {CATEGORY_ORDER.filter((cat) => domainAudits.some((x) => (x.category || "other") === cat)).map((cat) => (
                          <div key={cat}>
                            <div className="mb-1.5 flex items-center gap-2">
                              <Badge variant="secondary" className="text-[9px] uppercase tracking-wide">{cat}</Badge>
                              <span className="text-[10px] text-muted-foreground/50">{domainAudits.filter((x) => (x.category || "other") === cat).length}</span>
                            </div>
                            <div className="space-y-2">
                        {domainAudits.filter((x) => (x.category || "other") === cat).map((a) => (
                          <div key={a.id} className="group flex items-center gap-3 rounded-lg border border-border bg-card/30 p-3 transition-all hover:border-primary/30">
                            <ScoreBadge score={a.seo_score} />
                            <div className="min-w-0 flex-1">
                              <code className="truncate text-xs font-mono text-foreground/80">{a.path}</code>
                              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground/50">
                                <Clock size={9} /><span>{new Date(a.created_at).toLocaleString()}</span>
                                <span>·</span><span>{a.word_count} words</span>
                                <span>·</span><span className={a.critical_count > 0 ? "text-red-400" : "text-emerald-400"}>{a.critical_count} critical</span>
                                <span>·</span><span>{a.warning_count} warnings</span>
                              </div>
                              <p className="mt-0.5 truncate text-[10px] text-muted-foreground/40">{a.title || "(no title)"}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => viewSavedAudit(a)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:bg-secondary/60 hover:text-foreground" title="View"><ExternalLink size={12} /></button>
                              <button onClick={() => handleDeleteAudit(a.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:bg-red-500/10 hover:text-red-500" title="Delete"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SiteAuditModal;
