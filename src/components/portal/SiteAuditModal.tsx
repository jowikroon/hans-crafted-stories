import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { portalApi, SiteAuditResult } from "@/lib/api/portal";
import { useToast } from "@/hooks/use-toast";

interface SiteAuditModalProps {
  open: boolean;
  onClose: () => void;
}

const SiteAuditModal = ({ open, onClose }: SiteAuditModalProps) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SiteAuditResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await portalApi.runSiteAudit(url);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        toast({ title: "Audit failed", description: res.error || "Unknown error", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to run audit", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>

            <div className="mb-6">
              <div className="mb-1 flex items-center gap-2">
                <Globe size={20} className="text-green-500" />
                <h2 className="font-display text-xl font-medium">Site Audit</h2>
              </div>
              <p className="text-sm text-muted-foreground">Run a quick SEO audit on any URL</p>
            </div>

            <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
              <Input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading} className="shrink-0">
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Audit"}
              </Button>
            </form>

            {loading && (
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm">Crawling and analyzing…</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Score overview */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Words", value: result.wordCount },
                    { label: "Links", value: result.totalLinks },
                    { label: "Images", value: result.totalImages },
                    { label: "Issues", value: result.issues.length },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border p-3 text-center">
                      <p className="text-2xl font-semibold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Title & meta */}
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

                {/* Issues */}
                {result.issues.length > 0 && (
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
                )}
                {result.issues.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <CheckCircle size={14} /> No major issues found
                  </div>
                )}

                {/* Headings */}
                {result.headings.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-foreground">Headings Structure</h3>
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {result.headings.slice(0, 20).map((h, i) => (
                        <div key={i} className="flex items-baseline gap-2 text-sm">
                          <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-xs font-mono font-medium text-secondary-foreground">
                            {h.tag}
                          </span>
                          <span className="truncate text-muted-foreground">{h.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
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
