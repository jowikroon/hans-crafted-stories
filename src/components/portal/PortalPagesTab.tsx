import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, LayoutDashboard } from "lucide-react";
import { useAllPageElements } from "@/hooks/usePageElements";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const pageLabels: Record<string, string> = {
  home: "Home",
  about: "About",
  writing: "Writing",
  work: "Work",
};

const PortalPagesTab = () => {
  const { elements, loading, toggleVisibility } = useAllPageElements();
  const [activePage, setActivePage] = useState<string>("writing");

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">Loading page elements…</p>;
  }

  const pages = Array.from(new Set(elements.map((e) => e.page)));
  const pageElements = elements.filter((e) => e.page === activePage);
  const groups = Array.from(new Set(pageElements.map((e) => e.element_group)));

  return (
    <div>
      {/* Page selector */}
      <div className="mb-6 flex gap-2">
        {pages.map((page) => {
          const isActive = activePage === page;
          const visibleCount = elements.filter((e) => e.page === page && e.is_visible).length;
          const totalCount = elements.filter((e) => e.page === page).length;
          return (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "border-primary/30 bg-primary/5 text-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard size={14} />
              {pageLabels[page] || page}
              <span className={`ml-1 text-[10px] font-semibold ${
                visibleCount === totalCount ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              }`}>
                {visibleCount}/{totalCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Elements grouped */}
      <div className="space-y-6">
        {groups.map((group) => {
          const groupElements = pageElements.filter((e) => e.element_group === group);
          return (
            <div key={group}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group || "General"}
              </h3>
              <div className="space-y-2">
                {groupElements.map((el) => (
                  <motion.div
                    key={el.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                      el.is_visible
                        ? "border-border bg-card"
                        : "border-border/50 bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {el.is_visible ? (
                        <Eye size={15} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <EyeOff size={15} className="text-muted-foreground/40" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{el.element_label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {pageLabels[el.page] || el.page} → {el.element_key}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-[10px]">
                        {el.element_group}
                      </Badge>
                      <Switch
                        checked={el.is_visible}
                        onCheckedChange={(checked) => toggleVisibility(el.id, checked)}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortalPagesTab;
