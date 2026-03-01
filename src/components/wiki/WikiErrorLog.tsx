import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type EmpireEvent = Tables<"empire_events">;

const WikiErrorLog = () => {
  const [events, setEvents] = useState<EmpireEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchEvents = async () => {
    setLoading(true);
    let q = supabase
      .from("empire_events")
      .select("*")
      .in("event_type", ["error", "warning"])
      .order("created_at", { ascending: false })
      .limit(100);
    if (sourceFilter !== "all") q = q.eq("source", sourceFilter);
    const { data } = await q;
    setEvents(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [sourceFilter]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("wiki-error-log")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "empire_events" },
        (payload) => {
          const row = payload.new as EmpireEvent;
          if (row.event_type === "error" || row.event_type === "warning") {
            setEvents((prev) => [row, ...prev].slice(0, 100));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const sources = Array.from(new Set(events.map((e) => e.source)));

  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">
        Real-time errors and warnings from your AI services. Check here when a workflow or service isn’t behaving as expected.
      </p>
      <p className="mb-4 text-xs text-muted-foreground/80">
        Red = error (something broke). Amber = warning (needs attention).
      </p>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground"
        >
          <option value="all">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
        <span className="ml-auto text-[11px] text-muted-foreground">{events.length} events</span>
      </div>

      {/* Log list */}
      <div className="max-h-[400px] space-y-1 overflow-y-auto rounded-lg border border-border bg-card/30 p-2">
        {events.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {loading ? "Loading…" : "No error/warning events found."}
          </p>
        )}
        {events.map((ev) => {
          const isError = ev.event_type === "error";
          const isOpen = expanded.has(ev.id);
          return (
            <div
              key={ev.id}
              className={`rounded-lg border px-3 py-2 ${
                isError
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-amber-500/20 bg-amber-500/5"
              }`}
            >
              <button
                onClick={() => toggle(ev.id)}
                className="flex w-full items-start gap-2 text-left"
              >
                {isOpen ? <ChevronDown size={12} className="mt-0.5 shrink-0 text-muted-foreground" /> : <ChevronRight size={12} className="mt-0.5 shrink-0 text-muted-foreground" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${isError ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {ev.event_type}
                    </span>
                    <code className="text-[10px] text-muted-foreground">{ev.source}</code>
                    <span className="ml-auto text-[10px] text-muted-foreground/60">
                      {new Date(ev.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-foreground">{ev.message}</p>
                </div>
              </button>
              {isOpen && ev.metadata && (
                <pre className="mt-2 max-h-[200px] overflow-auto rounded bg-muted/50 p-2 text-[10px] text-muted-foreground">
                  {JSON.stringify(ev.metadata, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default WikiErrorLog;
