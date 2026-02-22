import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { blogPosts } from "@/data/content";
import { blogContent } from "@/data/blogContent";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);
  const content = slug ? blogContent[slug] : undefined;

  if (!post) {
    return (
      <section className="section-container pt-28 text-center">
        <h1 className="font-display text-3xl text-foreground">Post not found</h1>
        <Link to="/writing" className="mt-4 inline-block text-primary hover:underline">
          ← Back to Writing
        </Link>
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
        <Link
          to="/writing"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to Writing
        </Link>

        <div className="mb-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs uppercase tracking-widest text-primary">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="mb-4 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl">
          {post.title}
        </h1>

        <div className="mb-10 flex items-center gap-4 text-sm text-muted-foreground">
          <time>
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>

        <div className="prose prose-stone mx-auto max-w-3xl dark:prose-invert prose-headings:font-display prose-headings:font-medium prose-h2:text-2xl prose-p:leading-relaxed prose-li:leading-relaxed">
          {content ? (
            <div
              dangerouslySetInnerHTML={{
                __html: content
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
                  .join("\n"),
              }}
            />
          ) : (
            <p className="text-muted-foreground italic">Full article coming soon.</p>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default BlogPostPage;
