import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// ─── Blog Library overlay (design contract C1) ───────────────────────────────
// Grid van alle posts met filter-tabs (All/Draft/Review/Scheduled/Live), search,
// klik → open in editor. De "History"-knop in de Write-hero opent dit.

interface LibPost {
  id: string; title: string; slug: string; status: string; published: boolean;
  category: string; word_count: number | null; updated_at: string; image_url: string | null;
}

type Filter = "all" | "draft" | "review" | "scheduled" | "live";

function statusOf(p: LibPost): Filter {
  if (p.published || p.status === "published") return "live";
  if (p.status === "scheduled") return "scheduled";
  if (p.status === "review") return "review";
  return "draft";
}

export default function BlogLibrary({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<LibPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id, title, slug, status, published, category, word_count, updated_at, image_url")
      .order("updated_at", { ascending: false })
      .then(({ data }) => { setPosts((data ?? []) as LibPost[]); setLoading(false); });
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: posts.length, draft: 0, review: 0, scheduled: 0, live: 0 };
    posts.forEach((p) => { c[statusOf(p)]++; });
    return c;
  }, [posts]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter !== "all" && statusOf(p) !== filter) return false;
      if (needle && !(`${p.title} ${p.slug} ${p.category}`.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [posts, filter, q]);

  const open = useCallback((id: string) => { navigate(`/write/${id}`); onClose(); }, [navigate, onClose]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" }, { key: "draft", label: "Draft" }, { key: "review", label: "Review" },
    { key: "scheduled", label: "Scheduled" }, { key: "live", label: "Live" },
  ];

  return (
    <div className="lib-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lib-panel">
        <div className="lib-head">
          <div className="lib-title">Library<em>.</em> <span className="lib-total">{counts.all} artikelen</span></div>
          <button className="lib-close" onClick={onClose}>×</button>
        </div>
        <div className="lib-toolbar">
          <div className="lib-filters">
            {FILTERS.map((f) => (
              <button key={f.key} className={`lib-filter${filter === f.key ? " on" : ""}`} onClick={() => setFilter(f.key)}>
                {f.label} <span className="lib-filter-n">{counts[f.key]}</span>
              </button>
            ))}
          </div>
          <input className="lib-search" placeholder="Zoek op titel, slug, categorie…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="lib-body">
          {loading ? (
            <div className="lib-empty">Laden…</div>
          ) : visible.length === 0 ? (
            <div className="lib-empty">Geen artikelen voor dit filter.</div>
          ) : (
            <div className="lib-grid">
              {visible.map((p) => {
                const st = statusOf(p);
                return (
                  <button key={p.id} className="lib-card" onClick={() => open(p.id)}>
                    <div className={`lib-card-thumb thumb-${st}`}>
                      {p.image_url ? <img src={p.image_url} alt="" /> : <span className="lib-thumb-glyph">{p.title.slice(0, 1).toUpperCase()}</span>}
                      <span className={`lib-status lib-status--${st}`}>{st}</span>
                    </div>
                    <div className="lib-card-body">
                      <div className="lib-card-title">{p.title}</div>
                      <div className="lib-card-meta">{p.category || "—"} · {(p.word_count ?? 0).toLocaleString()}w · {new Date(p.updated_at).toLocaleDateString()}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
