import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { History, RotateCcw, Clock, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { getVersionsForPost, BlogPostVersion } from "@/lib/api/blogPostVersions";

interface Props {
  postId: string | undefined;
  open: boolean;
  onRestore: (version: BlogPostVersion) => void;
}

const BlogPostVersionHistory = ({ postId, open, onRestore }: Props) => {
  const [versions, setVersions] = useState<BlogPostVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !postId) return;
    setLoading(true);
    getVersionsForPost(postId)
      .then(setVersions)
      .catch((e) => toast({ title: "Error loading history", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [postId, open]);

  const grouped = useMemo(() => {
    const byDate: Record<string, BlogPostVersion[]> = { /* empty */ };
    for (const v of versions) {
      const dateKey = new Date(v.created_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(v);
    }
    return Object.entries(byDate);
  }, [versions]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const handleRestore = (v: BlogPostVersion) => {
    onRestore(v);
    toast({
      title: "Version restored",
      description: `Content restored to version from ${new Date(v.created_at).toLocaleString()}. Save to apply.`,
    });
  };

  if (!open) return null;
  if (!postId) return (
    <div className="border-t border-border/50 px-1 py-4 text-center text-xs text-muted-foreground/50">
      Save the post first to enable version history.
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-border/50"
    >
      <div className="flex items-center gap-2 px-1 pt-3 pb-2">
        <History size={14} className="text-primary" />
        <h3 className="text-xs font-semibold text-foreground">Version History</h3>
        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{versions.length}</Badge>
      </div>

      <ScrollArea className="max-h-64">
        {loading ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Loading history…</p>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <FileText size={20} className="mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No version history yet.</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/50">
              Versions are saved automatically when you update content.
            </p>
          </div>
        ) : (
          <div className="space-y-1 pb-2">
            {grouped.map(([date, items]) => (
              <Collapsible
                key={date}
                open={expandedGroups.has(date) || grouped.length <= 3}
                onOpenChange={() => toggleGroup(date)}
              >
                <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary/50">
                  <Clock size={11} className="shrink-0 text-muted-foreground/50" />
                  <span className="flex-1 text-[11px] font-medium text-foreground">{date}</span>
                  <span className="text-[10px] text-muted-foreground/50">{items.length} version{items.length !== 1 ? "s" : ""}</span>
                  {expandedGroups.has(date) || grouped.length <= 3 ? (
                    <ChevronUp size={11} className="text-muted-foreground/40" />
                  ) : (
                    <ChevronDown size={11} className="text-muted-foreground/40" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-4 space-y-1 border-l border-border/30 pl-3 pt-1">
                    {items.map((v) => (
                      <div
                        key={v.id}
                        className="group flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-secondary/30"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-foreground">{v.change_summary || "Updated"}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                            {v.title} — {v.content?.slice(0, 120) || "(empty)"}…
                          </p>
                          <span className="text-[9px] text-muted-foreground/40">
                            {new Date(v.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 shrink-0 gap-1 px-2 text-[10px] text-muted-foreground/50 opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                          onClick={() => handleRestore(v)}
                        >
                          <RotateCcw size={10} /> Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
};

export default BlogPostVersionHistory;
