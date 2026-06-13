import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ManageSourceBar from "../manage/ManageSourceBar";
import PromptTemplates from "../manage/PromptTemplates";
import { useBlogInitWorkflow } from "../manage/useBlogInitWorkflow";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  word_count: number;
  status: string;
  published: boolean;
  updated_at: string;
}

type FilterTab = "all" | "draft" | "live" | "scheduled";

function pillClass(status: string, published: boolean): string {
  if (status === "published" || published) return "live";
  if (status === "scheduled") return "scheduled";
  if (status === "review") return "review";
  return "draft";
}

function pillLabel(status: string, published: boolean): string {
  if (status === "published" || published) return "live";
  if (status === "review") return "in review";
  return status || "draft";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 24) return diffH <= 1 ? "1h" : `${diffH}h`;
  const diffD = Math.floor(diffMs / 86400000);
  if (diffD < 7) return `${diffD}d`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ManageMode() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug, category, word_count, status, published, updated_at")
      .order("updated_at", { ascending: false });
    if (data) setPosts(data as BlogPost[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const workflow = useBlogInitWorkflow(fetchPosts);

  const counts = useMemo(() => {
    const c = { all: posts.length, draft: 0, live: 0, scheduled: 0, review: 0 };
    for (const p of posts) {
      if (p.status === "published" || p.published) c.live++;
      else if (p.status === "scheduled") c.scheduled++;
      else if (p.status === "review") c.review++;
      else c.draft++;
    }
    return c;
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (filter === "live" && !(p.status === "published" || p.published)) return false;
      if (filter === "draft" && (p.status === "published" || p.published || p.status === "scheduled")) return false;
      if (filter === "scheduled" && p.status !== "scheduled") return false;
      if (search) {
        const q = search.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [posts, filter, search]);

  return (
    <main className="main manage-main">
      <h1 className="manage-h">Manage<em>.</em></h1>
      <div className="manage-stats">
        <strong>{counts.all}</strong> articles
        <span className="sep">·</span>
        <strong>{counts.live}</strong> live
        <span className="sep">·</span>
        <strong>{counts.draft}</strong> drafts
        {counts.review > 0 && (
          <>
            <span className="sep">·</span>
            <strong>{counts.review}</strong> in review
          </>
        )}
        {loading && (
          <>
            <span className="sep">·</span>
            <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>loading…</span>
          </>
        )}
      </div>

      {/* ── SourceBar — YouTube → n8n Ghost Writer pipeline ── */}
      <ManageSourceBar workflow={workflow} category="general" />
      <PromptTemplates category="professional" />

      {/* ── Posts table ── */}
      <div className="posts-wrap" style={{ marginTop: "var(--s-5)" }}>
        <div className="posts-toolbar">
          <div className="filter-tabs">
            <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>
              All <span style={{ opacity: 0.5, marginLeft: 4 }}>{counts.all}</span>
            </button>
            <button className={filter === "draft" ? "on" : ""} onClick={() => setFilter("draft")}>
              Draft <span style={{ opacity: 0.5, marginLeft: 4 }}>{counts.draft}</span>
            </button>
            <button className={filter === "live" ? "on" : ""} onClick={() => setFilter("live")}>
              Live <span style={{ opacity: 0.5, marginLeft: 4 }}>{counts.live}</span>
            </button>
            <button className={filter === "scheduled" ? "on" : ""} onClick={() => setFilter("scheduled")}>
              Scheduled <span style={{ opacity: 0.5, marginLeft: 4 }}>{counts.scheduled}</span>
            </button>
          </div>
          <span className="search-mini">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Filter posts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </span>
          <div className="grow" />
        </div>
        <table className="posts-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Category</th>
              <th className="num">Words</th>
              <th className="num">Date</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    padding: "48px 0",
                    color: "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  No posts found
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} onClick={() => navigate(`/write/${p.id}`)} style={{ cursor: "pointer" }}>
                <td className="title">
                  {p.title || "(Untitled)"}
                  <small>/{p.slug}</small>
                </td>
                <td>
                  <span className={`posts-pill ${pillClass(p.status, p.published)}`}>
                    {pillLabel(p.status, p.published)}
                  </span>
                </td>
                <td className="cat">{p.category}</td>
                <td className="num">{p.word_count ? p.word_count.toLocaleString() : "–"}</td>
                <td className="num" style={{ color: "var(--ink-2)" }}>{formatDate(p.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
