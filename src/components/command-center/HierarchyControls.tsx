import React, { useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Undo2, LayoutGrid, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PrimaryGoal,
  type HierarchyContext,
  HIERARCHY_MAP,
  ALL_TABS,
  getDefaultHierarchyContext,
  parseHierarchyFromStorage,
} from "@/lib/intent/types";

const GOAL_LABELS: Record<PrimaryGoal, { emoji: string; label: string }> = {
  seo_content: { emoji: "📈", label: "SEO & Content" },
  n8n_workflows: { emoji: "⚙️", label: "n8n Workflows" },
  data_feeds: { emoji: "📊", label: "Data Feeds" },
  campaigns: { emoji: "📣", label: "Campaigns" },
  web_scraping: { emoji: "🕸️", label: "Web Scraping" },
  system_health: { emoji: "🩺", label: "System Health" },
  general: { emoji: "🌐", label: "Algemeen" },
};

const STORAGE_KEY = "command_center_hierarchy_v2";
const ACCENT = "#ff6600";
const BORDER = "#1e1e1e";

interface HierarchyControlsProps {
  value: HierarchyContext;
  onChange: (next: HierarchyContext) => void;
  /** Optional: last applied context for undo. */
  lastValue?: HierarchyContext | null;
  onUndo?: () => void;
  className?: string;
}

/** Reorder tabs: goal-relevant first, then rest of ALL_TABS. */
function reorderTabs(primaryGoal: PrimaryGoal): string[] {
  const goalTabs = HIERARCHY_MAP[primaryGoal].tabs;
  const rest = ALL_TABS.filter((t) => !goalTabs.includes(t));
  return [...goalTabs, ...rest];
}

export function HierarchyControls({
  value,
  onChange,
  lastValue,
  onUndo,
  className,
}: HierarchyControlsProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>(
    value.activeTabs[0] ?? "All",
  );
  const isMobile = useIsMobile();

  const orderedTabs = useMemo(() => reorderTabs(value.primaryGoal), [value.primaryGoal]);
  const currentSubTools = useMemo(() => {
    const map = HIERARCHY_MAP[value.primaryGoal];
    return map.subTools;
  }, [value.primaryGoal]);

  const handleGoalSelect = useCallback(
    (goal: PrimaryGoal) => {
      const def = HIERARCHY_MAP[goal];
      const ordered = reorderTabs(goal);
      onChange({
        ...value,
        primaryGoal: goal,
        activeTabs: ordered,
        subTools: [...def.subTools],
        scope: [...def.subTools],
      });
      setActiveTab(def.tabs[0] ?? "All");
      if (isMobile) setMobileSheetOpen(false);
    },
    [value, onChange, isMobile],
  );

  const handleTabSelect = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleSubToolToggle = useCallback(
    (tool: string) => {
      const next = value.subTools.includes(tool)
        ? value.subTools.filter((t) => t !== tool)
        : [...value.subTools, tool];
      const scope = next.length > 0 ? next : currentSubTools;
      onChange({
        ...value,
        subTools: next,
        scope,
      });
    },
    [value, onChange, currentSubTools],
  );

  const canUndo = lastValue != null && lastValue !== value;
  const handleUndo = useCallback(() => {
    if (canUndo && onUndo) onUndo();
  }, [canUndo, onUndo]);

  useEffect(() => {
    if (!value.activeTabs.includes(activeTab)) {
      setActiveTab(value.activeTabs[0] ?? "All");
    }
  }, [value.activeTabs, activeTab]);

  const goalCards = useMemo(
    () =>
      (Object.keys(GOAL_LABELS) as PrimaryGoal[]).map((goal) => ({
        goal,
        ...GOAL_LABELS[goal],
        selected: value.primaryGoal === goal,
      })),
    [value.primaryGoal],
  );

  const layer1Content = (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
      role="radiogroup"
      aria-label="Hoofddoel (Laag 1)"
    >
      {goalCards.map(({ goal, emoji, label, selected }) => (
        <button
          key={goal}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => handleGoalSelect(goal)}
          className={cn(
            "rounded-lg border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
            selected
              ? "shadow-md"
              : "hover:border-[#ff6600]/40 hover:shadow-sm",
          )}
          style={{
            background: selected ? "rgba(255,102,0,0.08)" : "#111",
            borderColor: selected ? `${ACCENT}` : BORDER,
            color: selected ? ACCENT : "#e0e0e0",
          }}
        >
          <span className="text-xl" aria-hidden="true">
            {emoji}
          </span>
          <span className="ml-2 text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Laag 1: Desktop = inline grid; Mobile = Sheet trigger + content */}
      {isMobile ? (
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between rounded-lg border-[#1e1e1e] bg-[#111] text-xs text-[#e0e0e0] hover:bg-[#1a1a1a] hover:text-[#ff6600]"
              style={{ borderColor: BORDER }}
              aria-label="Open hoofddoel selectie"
            >
              <span className="flex items-center gap-2">
                <LayoutGrid className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                {GOAL_LABELS[value.primaryGoal].emoji}{" "}
                {GOAL_LABELS[value.primaryGoal].label}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(100vw-2rem,320px)] border-r border-[#1e1e1e] bg-[#0a0a0a] p-4"
            aria-describedby={undefined}
          >
            <SheetHeader>
              <SheetTitle className="text-left text-sm font-medium text-[#e0e0e0]">
                Hoofddoel (Laag 1)
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4">{layer1Content}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <div className="rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: "#666" }}
            >
              Hoofddoel
            </span>
            {canUndo && onUndo && (
              <button
                type="button"
                onClick={handleUndo}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors hover:bg-white/5"
                style={{ color: "#888" }}
                aria-label="Undo laatste selectie"
              >
                <Undo2 className="h-3 w-3" />
                Undo
              </button>
            )}
          </div>
          {layer1Content}
        </div>
      )}

      {/* Laag 2: Dynamic tab bar (always visible) */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabSelect}
        className="w-full"
      >
        <TabsList
          className="inline-flex h-9 w-full flex-wrap justify-start gap-0.5 rounded-lg border border-[#1e1e1e] bg-[#111] p-1"
          role="tablist"
          aria-label="Laag 2: Tabs"
        >
          {orderedTabs.map((tab) => {
            const isRelevant = HIERARCHY_MAP[value.primaryGoal].tabs.includes(tab);
            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-all data-[state=active]:shadow-sm",
                  isRelevant && "ring-1 ring-[#ff6600]/30",
                )}
                style={{
                  background: activeTab === tab ? "rgba(255,102,0,0.12)" : "transparent",
                  color: activeTab === tab ? ACCENT : isRelevant ? "#ccc" : "#666",
                  borderColor: "transparent",
                }}
              >
                {tab}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Laag 3: Sub-tools under active tab (same chips for every tab) */}
        {orderedTabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-2">
            <ScrollArea className="w-full overflow-x-auto rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-2 py-1.5">
              <div
                className="flex gap-1.5 py-0.5"
                role="group"
                aria-label="Contextuele sub-tools"
              >
                {currentSubTools.map((tool) => {
                  const selected = value.subTools.includes(tool);
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => handleSubToolToggle(tool)}
                      className={cn(
                        "inline-flex cursor-pointer items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6600]/50",
                        selected
                          ? "border-[#ff6600]/50 bg-[#ff6600]/15 text-[#ff6600]"
                          : "border-[#1e1e1e] bg-[#111] text-[#888] hover:border-[#333] hover:text-[#ccc]",
                      )}
                      aria-pressed={selected}
                    >
                      {tool}
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = React.useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

export const hierarchyStorage = {
  key: STORAGE_KEY,
  load(): HierarchyContext {
    if (typeof window === "undefined") return getDefaultHierarchyContext();
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = parseHierarchyFromStorage(raw);
    return parsed ?? getDefaultHierarchyContext();
  },
};
