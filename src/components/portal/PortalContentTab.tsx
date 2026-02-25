import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, FolderOpen, Plus, Pencil, Trash2, Eye, EyeOff, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  BlogPostRow, CaseStudyRow,
  getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost,
  getCaseStudies, createCaseStudy, updateCaseStudy, deleteCaseStudy,
} from "@/lib/api/content";
import { usersApi, UserContentAccess } from "@/lib/api/users";
import BlogPostFormModal from "./BlogPostFormModal";
import CaseStudyFormModal from "./CaseStudyFormModal";
import InfoTooltip from "./InfoTooltip";

interface PortalContentTabProps {
  userId?: string;
  isAdmin?: boolean;
}

const PortalContentTab = ({ userId, isAdmin = false }: PortalContentTabProps) => {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [studies, setStudies] = useState<CaseStudyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessMap, setAccessMap] = useState<Record<string, UserContentAccess> | null>(null);

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

      if (!isAdmin && userId) {
        const access = await usersApi.getContentAccess(userId);
        const map: Record<string, UserContentAccess> = {};
        for (const a of access) map[a.content_type] = a;
        setAccessMap(map);
      }
    } catch (e: any) {
      toast({ title: "Error loading content", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, userId]);

  useEffect(() => { load(); }, [load]);

  // Access checks
  const canViewBlogs = isAdmin || accessMap === null || accessMap["blog_posts"]?.can_view === true;
  const canEditBlogs = isAdmin || accessMap?.["blog_posts"]?.can_edit === true;
  const canViewStudies = isAdmin || accessMap === null || accessMap["case_studies"]?.can_view === true;
  const canEditStudies = isAdmin || accessMap?.["case_studies"]?.can_edit === true;

  const hasNoAccess = !isAdmin && accessMap !== null && !canViewBlogs && !canViewStudies;

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

  if (hasNoAccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <FileText size={20} className="text-muted-foreground/50" />
        </div>
        <h3 className="mb-1.5 font-display text-lg font-medium text-foreground">No content access</h3>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          You don't have access to any content yet. Contact your administrator to get started.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Blog Posts ──────────────────────────────────── */}
      {canViewBlogs && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-primary" />
              <h2 className="font-display text-sm font-medium text-foreground">Blog Posts</h2>
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{posts.length}</span>
              <InfoTooltip text="Manage blog articles, toggle visibility, and edit content" />
            </div>
            {canEditBlogs && (
              <Button size="sm" onClick={() => { setEditingPost(null); setPostModalOpen(true); }}>
                <Plus size={14} /> New Post
              </Button>
            )}
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
                  {canEditBlogs && (
                    <div className="ml-2 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingPost(p); setPostModalOpen(true); }}>
                        <Pencil size={13} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeletePost(p.id)}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Case Studies ───────────────────────────────── */}
      {canViewStudies && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen size={15} className="text-primary" />
              <h2 className="font-display text-sm font-medium text-foreground">Case Studies</h2>
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{studies.length}</span>
              <InfoTooltip text="Portfolio case studies with images, categories, and publication status" />
            </div>
            {canEditStudies && (
              <Button size="sm" onClick={() => { setEditingStudy(null); setStudyModalOpen(true); }}>
                <Plus size={14} /> New Study
              </Button>
            )}
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
                  {canEditStudies && (
                    <div className="ml-2 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingStudy(s); setStudyModalOpen(true); }}>
                        <Pencil size={13} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteStudy(s.id)}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {canEditBlogs && (
        <BlogPostFormModal
          open={postModalOpen}
          onOpenChange={setPostModalOpen}
          post={editingPost}
          onSave={handleSavePost}
        />
      )}

      {canEditStudies && (
        <CaseStudyFormModal
          open={studyModalOpen}
          onOpenChange={setStudyModalOpen}
          study={editingStudy}
          onSave={handleSaveStudy}
        />
      )}
    </div>
  );
};

export default PortalContentTab;
