import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  to?: string;
  highlight?: boolean;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const PageBreadcrumb = ({ items, className = "" }: PageBreadcrumbProps) => (
  <motion.nav
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className={`mb-8 flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}
    aria-label="Breadcrumb"
  >
    <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
      <Home size={12} />
      <span>Home</span>
    </Link>
    {items.map((item, i) => (
      <span key={i} className="flex items-center gap-1.5">
        <ChevronRight size={11} className="text-muted-foreground/40" />
        {item.to ? (
          <Link to={item.to} className="transition-colors hover:text-foreground">
            {item.label}
          </Link>
        ) : (
          <span className={item.highlight ? "font-medium text-primary" : "font-medium text-foreground"}>
            {item.label}
          </span>
        )}
      </span>
    ))}
  </motion.nav>
);

export default PageBreadcrumb;
