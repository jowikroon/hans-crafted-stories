import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ScrollText, AlertTriangle, Info, Zap, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmpireEvent {
  id: string;
  event_type: string;
  source: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const typeIcon = (type: string) => {
  switch (type) {
    case "error": return <AlertTriangle size={12} className="text-red-400" />;
    case "action": return <Zap size={12} className="text-amber-400" />;
    default: return <Info size={12} className="text-cyan-400" />;
  }
};

const EmpireAuditTrail = () => {
  const [events, setEvents] = useState<EmpireEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("empire_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setEvents((data as EmpireEvent[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("empire-events-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "empire_events" },
        (payload) => {
          const newEvent = payload.new as EmpireEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 50));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "empire_events" },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setEvents((prev) => prev.filter((e) => e.id !== deletedId));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/70">
          Audit Trail
          <span className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" title="Live" />
        </h2>
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 text-muted-foreground/50 transition-all hover:border-cyan-500/30 hover:text-cyan-400 disabled:opacity-30"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="rounded-xl border border-border/40 bg-secondary/10 divide-y divide-border/20 max-h-72 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ScrollText size={24} className="mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/50">No events yet</p>
          </div>
        ) : (
          events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 px-4 py-3"
            >
              <div className="mt-0.5 shrink-0">{typeIcon(event.event_type)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground/80 leading-relaxed">{event.message}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/40">{event.source}</span>
                  <span className="text-[9px] text-muted-foreground/30">
                    {new Date(event.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmpireAuditTrail;
