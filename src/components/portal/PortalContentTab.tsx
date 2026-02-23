import { FileText, Image, BookOpen, FolderOpen, ExternalLink } from "lucide-react";

interface ContentSection {
  icon: typeof FileText;
  label: string;
  description: string;
  count?: number;
  href?: string;
}

const sections: ContentSection[] = [
  {
    icon: BookOpen,
    label: "Blog Posts",
    description: "Manage articles, drafts, and published writing.",
    href: "/writing",
  },
  {
    icon: FolderOpen,
    label: "Case Studies",
    description: "Portfolio projects, client work, and showcases.",
    href: "/work",
  },
  {
    icon: Image,
    label: "Media Library",
    description: "Uploaded images, documents, and assets.",
  },
  {
    icon: FileText,
    label: "Pages",
    description: "Static pages like About, Home, and custom landing pages.",
  },
];

const PortalContentTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-medium text-foreground">Content</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage all site content from one place.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <a
              key={s.label}
              href={s.href || "#"}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-primary">
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-medium text-foreground">{s.label}</h3>
                  {s.href && (
                    <ExternalLink size={11} className="text-muted-foreground/40 transition-opacity group-hover:text-muted-foreground" />
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default PortalContentTab;
