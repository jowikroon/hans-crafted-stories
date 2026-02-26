import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, LayoutDashboard, ChevronRight, Globe } from "lucide-react";
import { useAllPageElements } from "@/hooks/usePageElements";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/hooks/useLang";
import PremiumToggle from "./PremiumToggle";

const pageLabels: Record<string, string> = {
  home: "Home",
  about: "About",
  writing: "Writing",
  work: "Work",
};

const PortalPagesTab = () => {
  const { lang, setLang } = useLang();
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
      {/* Page selector + Language switch */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {pages.map((page) => {
            const isActive = activePage === page;
            const visibleCount = elements.filter((e) => e.page === page && e.is_visible).length;
            const totalCount = elements.filter((e) => e.page === page).length;
            return (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
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

        {/* NL / ENG switch */}
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
          <Globe size={12} className="text-muted-foreground/50 mr-1" />
          <button
            onClick={() => setLang("nl")}
            className={`rounded px-2 py-1 text-xs font-semibold transition-all ${
              lang === "nl"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/50 hover:text-foreground"
            }`}
          >
            NL
          </button>
          <button
            onClick={() => setLang("en")}
            className={`rounded px-2 py-1 text-xs font-semibold transition-all ${
              lang === "en"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/50 hover:text-foreground"
            }`}
          >
            ENG
          </button>
        </div>
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
                    className={`flex items-center justify-between rounded-lg border p-4 transition-all duration-300 ${
                      el.is_visible
                        ? "border-border bg-card"
                        : "border-border/40 bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {el.is_visible ? (
                        <Eye size={15} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <EyeOff size={15} className="text-muted-foreground/30" />
                      )}
                      <div>
                        <p className={`text-sm font-medium transition-colors duration-300 ${
                          el.is_visible ? "text-foreground" : "text-muted-foreground/50"
                        }`}>
                          {el.element_label}
                        </p>

                        {/* Breadcrumb hierarchy path */}
                        <div className={`mt-0.5 flex items-center gap-1 text-[11px] transition-all duration-300 ${
                          el.is_visible
                            ? "text-muted-foreground"
                            : "text-muted-foreground/30"
                        }`}>
                          <span className={el.is_visible ? "text-primary/70" : ""}>
                            {pageLabels[el.page] || el.page}
                          </span>
                          <ChevronRight size={9} className="shrink-0 opacity-40" />
                          <span className={el.is_visible ? "text-muted-foreground/80" : ""}>
                            {el.element_group || "General"}
                          </span>
                          <ChevronRight size={9} className="shrink-0 opacity-40" />
                          <span className={`font-mono text-[10px] ${
                            el.is_visible 
                              ? "text-muted-foreground/60" 
                              : "text-muted-foreground/25"
                          }`}>
                            {el.element_key}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="secondary" 
                        className={`hidden text-[10px] sm:inline-flex transition-opacity duration-300 ${
                          el.is_visible ? "opacity-100" : "opacity-40"
                        }`}
                      >
                        {el.element_group}
                      </Badge>
                      <PremiumToggle
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
