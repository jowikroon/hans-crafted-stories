import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ChevronRight } from "lucide-react";
import { getBlogPost, BlogPostRow } from "@/lib/api/content";
import { blogContent } from "@/data/blogContent";
import { useSEO } from "@/hooks/useSEO";

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

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostRow | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    getBlogPost(slug).then(setPost);
  }, [slug]);

  const fullContent = post?.content || (slug ? blogContent[slug] : "") || "";
  const wordCount = useMemo(
    () => (fullContent ? fullContent.trim().split(/\s+/).length : 0),
    [fullContent]
  );

  useSEO({
    title: post ? `${post.title} | Hans van Leeuwen` : "Loading... | Hans van Leeuwen",
    description: post?.excerpt || "Read this article by Hans van Leeuwen on e-commerce, marketplace strategy, and digital commerce.",
    url: `https://hansvanleeuwen.com/writing/${slug}`,
    type: "article",
    jsonLd: post ? {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: `https://hansvanleeuwen.com/writing/${slug}`,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://hansvanleeuwen.com/writing/${slug}`,
      },
      datePublished: post.created_at,
      dateModified: post.updated_at,
      author: {
        "@type": "Person",
        "@id": "https://hansvanleeuwen.com/#person",
        name: "Hans van Leeuwen",
        url: "https://hansvanleeuwen.com",
      },
      publisher: {
        "@type": "Person",
        "@id": "https://hansvanleeuwen.com/#person",
        name: "Hans van Leeuwen",
        url: "https://hansvanleeuwen.com",
      },
      image: "https://hansvanleeuwen.com/og-image.png",
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

  return (
    <section className="section-container pt-28 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav
          className="mb-8 flex items-center gap-1.5 text-xs text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
            <Home size={12} />
            <span>Home</span>
          </Link>
          <ChevronRight size={11} className="text-muted-foreground/40" />
          <Link to="/writing" className="transition-colors hover:text-foreground">Writing</Link>
          <ChevronRight size={11} className="text-muted-foreground/40" />
          <span className="font-medium text-foreground line-clamp-1">{post.title}</span>
        </nav>

        <div className="mb-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs uppercase tracking-widest text-primary">{tag}</span>
          ))}
        </div>

        <h1 className="mb-4 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl">
          {post.title}
        </h1>

        <div className="mb-10 flex items-center gap-4 text-sm text-muted-foreground">
          <time>
            {new Date(post.created_at).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            })}
          </time>
          <span>·</span>
          <span>{post.read_time}</span>
        </div>

        <div className="prose prose-stone mx-auto max-w-3xl dark:prose-invert prose-headings:font-display prose-headings:font-medium prose-h2:text-2xl prose-p:leading-relaxed prose-li:leading-relaxed">
          {post.content ? (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
          ) : (
            <p className="text-muted-foreground italic">Full article coming soon.</p>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default BlogPostPage;