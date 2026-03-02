import { useState, useEffect, useMemo } from "react";
import { getBlogPosts } from "@/lib/api/content";
import BlogPostCard from "@/components/BlogPostCard";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ChevronRight, Link2, Facebook, Linkedin, Twitter } from "lucide-react";
import { getBlogPost, BlogPostRow } from "@/lib/api/content";
import { blogContent } from "@/data/blogContent";
import { usePreloadedBlogPost } from "@/contexts/PreloadedDataContext";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { toast } from "sonner";
import hansProfile from "@/assets/hans-profile.jpg";

const CATEGORY_COLORS: Record<string, string> = {
  professional: "bg-primary/90 text-primary-foreground",
  personal: "bg-amber-600/90 text-white",
};

const renderMarkdown = (md: string) =>
  md
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) return `<h2>${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("### ")) return `<h3>${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith("**") && trimmed.endsWith("**"))
        return `<p><strong>${trimmed.slice(2, -2)}</strong></p>`;
      if (trimmed.startsWith("- **"))
        return `<li><strong>${trimmed.match(/\*\*(.*?)\*\*/)?.[1]}</strong>${trimmed.replace(/- \*\*.*?\*\*/, "")}</li>`;
      if (trimmed.startsWith("- ")) return `<li>${trimmed.slice(2)}</li>`;
      if (trimmed === "") return "";
      return `<p>${trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</p>`;
    })
    .join("\n");

const shareUrl = (platform: string, url: string, title: string) => {
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`;
    default:
      return "#";
  }
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const preloaded = usePreloadedBlogPost(slug);
  const [post, setPost] = useState<BlogPostRow | null | undefined>(
    () => (preloaded ?? undefined) as BlogPostRow | undefined
  );
  const { lang } = useLang();

  useEffect(() => {
    if (!slug) return;
    if (preloaded?.slug === slug) {
      setPost(preloaded);
      return;
    }
    setPost(undefined);
    getBlogPost(slug).then(setPost);
  }, [slug, preloaded]);

  // Language-aware fields
  const displayTitle = post ? ((lang === "nl" && post.title_nl) ? post.title_nl : post.title) : "";
  const displayExcerpt = post ? ((lang === "nl" && post.excerpt_nl) ? post.excerpt_nl : post.excerpt) : "";
  const displayContent = post ? ((lang === "nl" && post.content_nl) ? post.content_nl : post.content) : "";

  const fullContent = displayContent || (slug ? blogContent[slug] : "") || "";
  const wordCount = useMemo(
    () => (fullContent ? fullContent.trim().split(/\s+/).length : 0),
    [fullContent]
  );

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  useSEO({
    title: post ? `${displayTitle} | Hans van Leeuwen` : "Loading... | Hans van Leeuwen",
    description: displayExcerpt || "Read this article by Hans van Leeuwen on e-commerce, marketplace strategy, and digital commerce.",
    url: `https://hansvanleeuwen.com/writing/${slug}`,
    type: "article",
    jsonLd: post ? {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: displayTitle,
      description: displayExcerpt,
      url: `https://hansvanleeuwen.com/writing/${slug}`,
      mainEntityOfPage: { "@type": "WebPage", "@id": `https://hansvanleeuwen.com/writing/${slug}` },
      datePublished: post.created_at,
      dateModified: post.updated_at,
      author: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", name: "Hans van Leeuwen", url: "https://hansvanleeuwen.com" },
      publisher: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", name: "Hans van Leeuwen", url: "https://hansvanleeuwen.com" },
      image: post.image_url || "https://hansvanleeuwen.com/og-image.png",
      articleSection: post.category,
      keywords: post.tags.join(", "),
      ...(wordCount > 0 ? { wordCount } : {}),
      inLanguage: "en",
    } : undefined,
  });

  if (post === undefined) {
    return <section className="section-container pt-28"><p className="text-muted-foreground">Loading…</p></section>;
  }

  if (!post) {
    return (
      <section className="section-container pt-28 text-center">
        <h1 className="font-display text-3xl text-foreground">Post not found</h1>
        <Link to="/writing" className="mt-4 inline-block text-primary hover:underline">← Back to Writing</Link>
      </section>
    );
  }

  const categoryColor = CATEGORY_COLORS[post.category] ?? "bg-muted text-foreground";
  const dateStr = new Date(post.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    toast.success("Link copied to clipboard");
  };

  return (
    <article>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full"
      >
        {/* Hero Image */}
        <div className="relative h-[50vh] min-h-[400px] max-h-[560px] w-full overflow-hidden md:h-[60vh]">
          {post.image_url ? (
            <img
              src={post.image_url}
              alt={displayTitle}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

          {/* Breadcrumb over hero */}
          <div className="absolute inset-x-0 top-0 z-10">
            <div className="section-container pt-24">
              <nav className="flex items-center gap-1.5 text-xs text-white/60" aria-label="Breadcrumb">
                <Link to="/" className="flex items-center gap-1 transition-colors hover:text-white">
                  <Home size={12} />
                  <span>Home</span>
                </Link>
                <ChevronRight size={11} className="text-white/30" />
                <Link to="/writing" className="transition-colors hover:text-white">Writing</Link>
                <ChevronRight size={11} className="text-white/30" />
                <span className="font-medium text-white/90 line-clamp-1">{displayTitle}</span>
              </nav>
            </div>
          </div>

          {/* Hero content */}
          <div className="absolute inset-x-0 bottom-0 z-10">
            <div className="section-container pb-10">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Meta badges */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${categoryColor}`}>
                    {post.category}
                  </span>
                  <span className="text-sm text-white/60">{dateStr}</span>
                  <span className="text-white/30">·</span>
                  <span className="text-sm text-white/60">{post.read_time}</span>
                </div>

                {/* Title */}
                <h1 className="mb-3 max-w-3xl font-display text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
                  {displayTitle}
                </h1>

                {/* Excerpt */}
                {displayExcerpt && (
                  <p className="max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
                    {displayExcerpt}
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Author bar + Share icons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="border-b border-border"
      >
        <div className="section-container flex items-center justify-between py-5">
          {/* Author */}
          <div className="flex items-center gap-3">
            <img
              src={hansProfile}
              alt="Hans van Leeuwen"
              className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Hans van Leeuwen</p>
              <p className="text-xs text-muted-foreground">E-commerce & Marketplace Specialist</p>
            </div>
          </div>

          {/* Share icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyLink}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Copy link"
            >
              <Link2 size={16} />
            </button>
            <a
              href={shareUrl("twitter", currentUrl, displayTitle)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Share on Twitter"
            >
              <Twitter size={16} />
            </a>
            <a
              href={shareUrl("facebook", currentUrl, displayTitle)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Share on Facebook"
            >
              <Facebook size={16} />
            </a>
            <a
              href={shareUrl("linkedin", currentUrl, displayTitle)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Share on LinkedIn"
            >
              <Linkedin size={16} />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Article body */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="section-container pb-20 pt-12"
      >
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mx-auto mb-8 flex max-w-3xl flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="prose prose-stone mx-auto max-w-3xl dark:prose-invert prose-headings:font-display prose-headings:font-medium prose-h2:text-2xl prose-p:leading-relaxed prose-li:leading-relaxed">
          {fullContent ? (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(fullContent) }} />
          ) : (
            <p className="text-muted-foreground italic">Full article coming soon.</p>
          )}
        </div>
      </motion.div>

      {/* Related Articles */}
      <RelatedArticles category={post.category} currentSlug={post.slug} />
    </article>
  );
};

const RelatedArticles = ({ category, currentSlug }: { category: string; currentSlug: string }) => {
  const [related, setRelated] = useState<
    { id: string; title: string; excerpt: string; category: "professional" | "personal"; tags: string[]; date: string; readTime: string; slug: string; imageUrl?: string }[]
  >([]);

  useEffect(() => {
    getBlogPosts(true).then((posts) => {
      const filtered = posts
        .filter((p) => p.category === category && p.slug !== currentSlug)
        .slice(0, 3)
        .map((p) => ({
          id: p.id,
          title: p.title,
          excerpt: p.excerpt,
          category: p.category as "professional" | "personal",
          tags: p.tags,
          date: p.created_at,
          readTime: p.read_time,
          slug: p.slug,
          imageUrl: p.image_url || undefined,
        }));
      setRelated(filtered);
    });
  }, [category, currentSlug]);

  if (related.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="border-t border-border"
    >
      <div className="section-container py-16">
        <h2 className="mb-8 font-display text-2xl font-medium text-foreground">Related Articles</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((post, i) => (
            <BlogPostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default BlogPostPage;
