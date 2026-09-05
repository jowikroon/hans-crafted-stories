import { useState, useEffect } from "react";
import { Link } from "@/components/LocalizedLink";
import { ArrowRight } from "lucide-react";
import { getBlogPosts, BlogPostRow } from "@/lib/api/content";
import { useLang } from "@/hooks/useLang";
import "@/styles/writing-v2.css";
import { ensureFontCss, FONT_CSS } from "@/lib/fontCss";

/**
 * FeaturedArticles — homepage "writing" teaser.
 *
 * 2026-06-15: restyled to the writing-v2 row language so the homepage and
 * /writing share one visual system (no more dark image-card grid). Renders
 * the 3 newest posts as editorial rows inside a .writing-v2 scope.
 * Data flow unchanged — still getBlogPosts(true) from Supabase.
 */

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale === "nl" ? "nl-NL" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

const FeaturedArticles = () => {
  useEffect(() => { ensureFontCss("fonts-writing", FONT_CSS.writing); }, []);
  const { lang } = useLang();
  const isNl = lang === "nl";
  const [posts, setPosts] = useState<BlogPostRow[]>([]);

  useEffect(() => {
    getBlogPosts(true).then((p) => setPosts(p.slice(0, 3)));
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="section-container pb-20" aria-label={isNl ? "Uitgelichte artikelen" : "Featured articles"}>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="mb-1 inline-flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.16em] text-primary">
            <span className="inline-block h-px w-7 bg-primary" aria-hidden="true" />{isNl ? "Uitgelicht" : "Writing"}
          </h2>
          <p className="font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
            {isNl ? "Uitgelichte artikelen" : "Featured Articles"}
          </p>
        </div>
        <Link
          to="/writing"
          className="group hidden items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          {isNl ? "Bekijk alles" : "View all"}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="writing-v2">
        <div className="list" style={{ padding: 0 }}>
          {posts.map((post) => {
            const title = isNl && post.title_nl ? post.title_nl : post.title;
            const excerpt = isNl && post.excerpt_nl ? post.excerpt_nl : post.excerpt;
            return (
              <Link key={post.id} to={`/writing/${post.slug}`} className="post">
                <div className="post__thumb">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={title}
                      width={600}
                      height={400}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>
                <div className="post__body">
                  <div className="post__meta">
                    <time className="post__date" dateTime={post.created_at}>
                      {formatDate(post.created_at, lang)}
                    </time>
                    <span className="dot"></span>
                    <span className="tag">{post.category}</span>
                    {post.read_time && (
                      <>
                        <span className="dot"></span>
                        <span>{post.read_time}</span>
                      </>
                    )}
                  </div>
                  <h2 className="post__title">{title}</h2>
                  <p className="post__excerpt">{excerpt}</p>
                </div>
                <span className="post__go" aria-hidden="true">
                  <ArrowIcon />
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <Link
        to="/writing"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:hidden"
      >
        {isNl ? "Bekijk alles" : "View all"} <ArrowRight size={14} />
      </Link>
    </section>
  );
};

export default FeaturedArticles;
