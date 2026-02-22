import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { portalApi, KeywordResult } from "@/lib/api/portal";
import { useToast } from "@/hooks/use-toast";

interface KeywordResearchModalProps {
  open: boolean;
  onClose: () => void;
}

const difficultyColor = (d: string) => {
  if (d === "low") return "text-green-500";
  if (d === "medium") return "text-orange-500";
  return "text-red-500";
};

const intentBadge = (intent: string) => {
  const colors: Record<string, string> = {
    informational: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    navigational: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    transactional: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    commercial: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };
  return colors[intent] || "bg-secondary text-secondary-foreground";
};

const KeywordResearchModal = ({ open, onClose }: KeywordResearchModalProps) => {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KeywordResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await portalApi.keywordResearch(keyword);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        toast({ title: "Research failed", description: res.error || "Unknown error", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to research keyword", variant: "destructive" });
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
                <Globe size={20} className="text-blue-500" />
                <h2 className="font-display text-xl font-medium">Keyword Research</h2>
              </div>
              <p className="text-sm text-muted-foreground">AI-powered keyword analysis and content suggestions</p>
            </div>

            <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
              <Input
                type="text"
                placeholder="Enter a seed keyword…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading} className="shrink-0">
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Analyze"}
              </Button>
            </form>

            {loading && (
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm">Analyzing keyword…</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Overview */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Seed Keyword</p>
                    <p className="font-medium text-foreground">{result.seed_keyword}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Intent</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${intentBadge(result.search_intent)}`}>
                      {result.search_intent}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Difficulty</p>
                    <p className={`font-medium capitalize ${difficultyColor(result.difficulty)}`}>{result.difficulty}</p>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-sm text-muted-foreground">{result.summary}</p>

                {/* Related Keywords */}
                {result.related_keywords.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-foreground">Related Keywords</h3>
                    <div className="overflow-hidden rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/50">
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Keyword</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Intent</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Difficulty</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Relevance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.related_keywords.map((kw, i) => (
                            <tr key={i} className="border-b border-border last:border-0">
                              <td className="px-3 py-2 text-foreground">{kw.keyword}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${intentBadge(kw.intent)}`}>
                                  {kw.intent}
                                </span>
                              </td>
                              <td className={`px-3 py-2 capitalize ${difficultyColor(kw.difficulty)}`}>{kw.difficulty}</td>
                              <td className="px-3 py-2 capitalize text-muted-foreground">{kw.relevance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Content Suggestions */}
                {result.content_suggestions.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-foreground">Content Suggestions</h3>
                    <div className="space-y-2">
                      {result.content_suggestions.map((s, i) => (
                        <div key={i} className="rounded-lg border border-border p-3">
                          <p className="text-sm font-medium text-foreground">{s.title}</p>
                          <div className="mt-1 flex gap-2">
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">{s.type}</span>
                            <span className="text-xs text-muted-foreground">Target: {s.target_keyword}</span>
                          </div>
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

export default KeywordResearchModal;
