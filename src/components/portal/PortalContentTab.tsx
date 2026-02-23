import { useState, useEffect, useCallback } from "react";
import { BookOpen, FolderOpen, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  BlogPostRow, CaseStudyRow,
  getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost,
  getCaseStudies, createCaseStudy, updateCaseStudy, deleteCaseStudy,
} from "@/lib/api/content";
import BlogPostFormModal from "./BlogPostFormModal";
import CaseStudyFormModal from "./CaseStudyFormModal";

const PortalContentTab = () => {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [studies, setStudies] = useState<CaseStudyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostRow | null>(null);

  const [studyModalOpen, setStudyModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<CaseStudyRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([getBlogPosts(false), getCaseStudies(false)]);
      setPosts(p);
      setStudies(s);
    } catch (e: any) {
      toast({ title: "Error loading content", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Blog Post handlers ─────────────────────────────────
  const handleSavePost = async (data: Partial<BlogPostRow>) => {
    if (editingPost) {
      await updateBlogPost(editingPost.id, data);
      toast({ title: "Blog post updated" });
    } else {
      await createBlogPost(data);
      toast({ title: "Blog post created" });
    }
    load();
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    await deleteBlogPost(id);
    toast({ title: "Blog post deleted" });
    load();
  };

  // ── Case Study handlers ────────────────────────────────
  const handleSaveStudy = async (data: Partial<CaseStudyRow>) => {
    if (editingStudy) {
      await updateCaseStudy(editingStudy.id, data);
      toast({ title: "Case study updated" });
    } else {
      await createCaseStudy(data);
      toast({ title: "Case study created" });
    }
    load();
  };

  const handleDeleteStudy = async (id: string) => {
    if (!confirm("Delete this case study?")) return;
    await deleteCaseStudy(id);
    toast({ title: "Case study deleted" });
    load();
  };

  return (
    <div className="space-y-8">
      {/* ── Blog Posts ──────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            <h2 className="font-display text-lg font-medium text-foreground">Blog Posts</h2>
            <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{posts.length}</span>
          </div>
          <Button size="sm" onClick={() => { setEditingPost(null); setPostModalOpen(true); }}>
            <Plus size={14} /> New Post
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blog posts yet.</p>
        ) : (
          <div className="space-y-2">
            {posts.map((p) => (
              <div key={p.id} className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-medium text-foreground">{p.title}</h3>
                    {p.published ? (
                      <Eye size={12} className="shrink-0 text-primary" />
                    ) : (
                      <EyeOff size={12} className="shrink-0 text-muted-foreground/50" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.category} · {p.tags.join(", ")} · {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-2 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingPost(p); setPostModalOpen(true); }}>
                    <Pencil size={13} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeletePost(p.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Case Studies ───────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-primary" />
            <h2 className="font-display text-lg font-medium text-foreground">Case Studies</h2>
            <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{studies.length}</span>
          </div>
          <Button size="sm" onClick={() => { setEditingStudy(null); setStudyModalOpen(true); }}>
            <Plus size={14} /> New Study
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : studies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No case studies yet.</p>
        ) : (
          <div className="space-y-2">
            {studies.map((s) => (
              <div key={s.id} className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {s.image && (
                    <img src={s.image} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-medium text-foreground">{s.title}</h3>
                      {s.published ? (
                        <Eye size={12} className="shrink-0 text-primary" />
                      ) : (
                        <EyeOff size={12} className="shrink-0 text-muted-foreground/50" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.category} · {s.year}</p>
                  </div>
                </div>
                <div className="ml-2 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingStudy(s); setStudyModalOpen(true); }}>
                    <Pencil size={13} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteStudy(s.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BlogPostFormModal
        open={postModalOpen}
        onOpenChange={setPostModalOpen}
        post={editingPost}
        onSave={handleSavePost}
      />

      <CaseStudyFormModal
        open={studyModalOpen}
        onOpenChange={setStudyModalOpen}
        study={editingStudy}
        onSave={handleSaveStudy}
      />
    </div>
  );
};

export default PortalContentTab;