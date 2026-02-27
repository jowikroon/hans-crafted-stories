import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getBlogPosts, BlogPostRow } from "@/lib/api/content";
import BlogPostCard from "@/components/BlogPostCard";

const FeaturedArticles = () => {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);

  useEffect(() => {
    getBlogPosts(true).then((p) => setPosts(p.slice(0, 3)));
  }, []);

  if (posts.length === 0) return null;

  const mapped = posts.map((p) => ({
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

  return (
    <section className="section-container pb-20" aria-label="Featured Articles">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex items-end justify-between"
      >
        <div>
          <h2 className="mb-1 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Writing
          </h2>
          <p className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Featured Articles
          </p>
        </div>
        <Link
          to="/writing"
          className="group hidden items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          View all
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mapped.map((post, i) => (
          <BlogPostCard key={post.id} post={post} index={i} />
        ))}
      </div>

      <Link
        to="/writing"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:hidden"
      >
        View all <ArrowRight size={14} />
      </Link>
    </section>
  );
};

export default FeaturedArticles;
