import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, FolderOpen, Plus, Pencil, Trash2, Eye, EyeOff, FileText, Layout, Home, Briefcase, PenLine, User, Search, ArrowUpDown, CheckSquare, Square, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  BlogPostRow, CaseStudyRow,
  getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost,
  getCaseStudies, createCaseStudy, updateCaseStudy, deleteCaseStudy,
} from "@/lib/api/content";
import { usersApi, UserContentAccess } from "@/lib/api/users";
import { getAllPageContent, PageContentRow } from "@/lib/api/pageContent";
import BlogPostFormModal from "./BlogPostFormModal";
import CaseStudyFormModal from "./CaseStudyFormModal";
import PageContentEditorModal from "./PageContentEditorModal";
import MediaLibraryModal from "./MediaLibraryModal";
import InfoTooltip from "./InfoTooltip";
import PortalLangToggle from "./PortalLangToggle";

interface PortalContentTabProps {
  userId?: string;
  isAdmin?: boolean;
  subFilter?: string;
}

const PortalContentTab = ({ userId, isAdmin = false, subFilter }: PortalContentTabProps) => {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [studies, setStudies] = useState<CaseStudyRow[]>([]);
  const [pageContent, setPageContent] = useState<PageContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessMap, setAccessMap] = useState<Record<string, UserContentAccess> | null>(null);

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostRow | null>(null);

  const [studyModalOpen, setStudyModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<CaseStudyRow | null>(null);

  const [pageEditorOpen, setPageEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<string | null>(null);

  // Search, sort, bulk selection
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [selectedStudies, setSelectedStudies] = useState<Set<string>>(new Set());
  const [mediaOpen, setMediaOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, pc] = await Promise.all([getBlogPosts(false), getCaseStudies(false), getAllPageContent()]);
      setPosts(p);
      setStudies(s);
      setPageContent(pc);

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

  // Filtered and sorted posts
  const filteredPosts = useMemo(() => {
    let result = posts.filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)) || p.category.toLowerCase().includes(q);
    });
    if (sortBy === "newest") result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    else if (sortBy === "oldest") result.sort((a, b) => a.created_at.localeCompare(b.created_at));
    else result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [posts, searchQuery, sortBy]);

  const filteredStudies = useMemo(() => {
    if (!searchQuery) return studies;
    const q = searchQuery.toLowerCase();
    return studies.filter(s => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
  }, [studies, searchQuery]);

  // Bulk handlers
  const togglePostSelection = (id: string) => {
    setSelectedPosts(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleStudySelection = (id: string) => {
    setSelectedStudies(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const selectAllPosts = () => {
    if (selectedPosts.size === filteredPosts.length) setSelectedPosts(new Set());
    else setSelectedPosts(new Set(filteredPosts.map(p => p.id)));
  };
  const handleBulkDeletePosts = async () => {
    if (!confirm(`Delete ${selectedPosts.size} post(s)?`)) return;
    for (const id of selectedPosts) await deleteBlogPost(id);
    toast({ title: `${selectedPosts.size} post(s) deleted` });
    setSelectedPosts(new Set());
    load();
  };
  const handleBulkTogglePosts = async (publish: boolean) => {
    for (const id of selectedPosts) await updateBlogPost(id, { published: publish });
    toast({ title: `${selectedPosts.size} post(s) ${publish ? "published" : "unpublished"}` });
    setSelectedPosts(new Set());
    load();
  };

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

  const showBlogs = canViewBlogs && (!subFilter || subFilter === "All" || subFilter === "Blog Posts");
  const showStudies = canViewStudies && (!subFilter || subFilter === "All" || subFilter === "Case Studies");
  const showMainMenu = isAdmin && (!subFilter || subFilter === "All" || subFilter === "Main Menu");

  const PAGES = ["home", "work", "writing", "about"] as const;
  const pageLabels: Record<string, string> = { home: "Home", work: "Work", writing: "Writing", about: "About" };
  const pageIcons: Record<string, typeof Home> = { home: Home, work: Briefcase, writing: PenLine, about: User };
  const pageRoutes: Record<string, string> = { home: "/", work: "/work", writing: "/writing", about: "/about" };
  const getPageContentCount = (page: string) => pageContent.filter((r) => r.page === page).length;
  const getPageGroups = (page: string) => {
    const groups = new Set(pageContent.filter((r) => r.page === page).map((r) => r.content_group || "General"));
    return Array.from(groups);
  };
  const getPageLastUpdated = (page: string) => {
    const rows = pageContent.filter((r) => r.page === page);
    if (rows.length === 0) return null;
    return rows.reduce((latest, r) => r.updated_at > latest ? r.updated_at : latest, rows[0].updated_at);
  };

  return (
    <div className="space-y-8">
      {/* Search bar + Language toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, studies, tags…"
            className="w-full rounded-lg border border-border bg-card/50 py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 focus:border-primary/40 focus:ring-1 focus:ring-primary/15 transition-all"
          />
        </div>
        <button
          onClick={() => setSortBy(sortBy === "newest" ? "oldest" : sortBy === "oldest" ? "title" : "newest")}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title={`Sort: ${sortBy}`}
        >
          <ArrowUpDown size={13} />
          {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "A–Z"}
        </button>
        <button
          onClick={() => setMediaOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Media Library"
        >
          <ImageIcon size={13} />
          Media
        </button>
        <PortalLangToggle />
      </div>

      {/* ── Blog Posts ──────────────────────────────────── */}
      {showBlogs && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-primary" />
              <h2 className="font-display text-sm font-medium text-foreground">Blog Posts</h2>
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {searchQuery ? `${filteredPosts.length}/${posts.length}` : posts.length}
              </span>
              <InfoTooltip text="Manage blog articles, toggle visibility, and edit content" />
            </div>
            {canEditBlogs && (
              <Button size="sm" onClick={() => { setEditingPost(null); setPostModalOpen(true); }}>
                <Plus size={14} /> New Post
              </Button>
            )}
          </div>

          {/* Bulk actions bar */}
          {canEditBlogs && selectedPosts.size > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <span className="text-xs font-medium text-primary">{selectedPosts.size} selected</span>
              <div className="flex-1" />
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleBulkTogglePosts(true)}>
                <Eye size={12} className="mr-1" /> Publish
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleBulkTogglePosts(false)}>
                <EyeOff size={12} className="mr-1" /> Unpublish
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={handleBulkDeletePosts}>
                <Trash2 size={12} className="mr-1" /> Delete
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedPosts(new Set())}>
                Clear
              </Button>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filteredPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{searchQuery ? "No posts match your search." : "No blog posts yet."}</p>
          ) : (
            <div className="space-y-2">
              {canEditBlogs && filteredPosts.length > 1 && (
                <button onClick={selectAllPosts} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors mb-1">
                  {selectedPosts.size === filteredPosts.length ? <CheckSquare size={12} /> : <Square size={12} />}
                  {selectedPosts.size === filteredPosts.length ? "Deselect all" : "Select all"}
                </button>
              )}
              {filteredPosts.map((p) => (
                <div key={p.id} className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {canEditBlogs && (
                      <button onClick={() => togglePostSelection(p.id)} className="shrink-0 text-muted-foreground/40 hover:text-primary transition-colors">
                        {selectedPosts.has(p.id) ? <CheckSquare size={14} className="text-primary" /> : <Square size={14} />}
                      </button>
                    )}
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
      {showStudies && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen size={15} className="text-primary" />
              <h2 className="font-display text-sm font-medium text-foreground">Case Studies</h2>
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {searchQuery ? `${filteredStudies.length}/${studies.length}` : studies.length}
              </span>
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
          ) : filteredStudies.length === 0 ? (
            <p className="text-sm text-muted-foreground">{searchQuery ? "No studies match your search." : "No case studies yet."}</p>
          ) : (
            <div className="space-y-2">
              {filteredStudies.map((s) => (
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

      {/* ── Main Menu ─────────────────────────────────── */}
      {showMainMenu && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Layout size={15} className="text-primary" />
            <h2 className="font-display text-sm font-medium text-foreground">Main Menu Pages</h2>
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{PAGES.length}</span>
            <InfoTooltip text="Edit on-page text content for each main site page" />
          </div>
          <div className="space-y-2">
            {PAGES.map((page) => {
              const Icon = pageIcons[page];
              const groups = getPageGroups(page);
              const fieldCount = getPageContentCount(page);
              const lastUpdated = getPageLastUpdated(page);
              return (
                <button
                  key={page}
                  onClick={() => { setEditingPage(page); setPageEditorOpen(true); }}
                  className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3.5 text-left transition-all hover:border-primary/30"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">{pageLabels[page]}</h3>
                      <Badge variant="outline" className="h-4 border-border/60 px-1.5 text-[10px] text-muted-foreground/60 font-mono">
                        {pageRoutes[page]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {groups.join(", ")} — {fieldCount} fields
                      {lastUpdated && (
                        <span className="ml-1.5 text-muted-foreground/50">· Updated {new Date(lastUpdated).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                  <Pencil size={13} className="shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                </button>
              );
            })}
          </div>
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

      {editingPage && (
        <PageContentEditorModal
          open={pageEditorOpen}
          onOpenChange={setPageEditorOpen}
          page={editingPage}
          rows={pageContent.filter((r) => r.page === editingPage)}
          onSaved={load}
        />
      )}

      <MediaLibraryModal
        open={mediaOpen}
        onOpenChange={setMediaOpen}
      />
    </div>
  );
};

export default PortalContentTab;
