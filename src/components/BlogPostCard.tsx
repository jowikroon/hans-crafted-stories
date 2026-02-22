import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BlogPost } from "@/data/types";

const BlogPostCard = ({ post, index }: { post: BlogPost; index: number }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    className="group border-b border-border py-6 transition-colors duration-300 first:border-t"
  >
    <Link to={`/writing/${post.slug}`} className="block">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="flex-1">
          <h3 className="mb-1 font-display text-lg font-medium text-foreground transition-colors duration-300 group-hover:text-primary">
            {post.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs uppercase tracking-widest text-muted-foreground/70">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground md:flex-col md:items-end md:gap-1">
          <time>{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
          <span>{post.readTime}</span>
        </div>
      </div>
    </Link>
  </motion.article>
);

export default BlogPostCard;
