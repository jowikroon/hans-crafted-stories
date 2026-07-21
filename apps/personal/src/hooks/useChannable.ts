import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─────────────────────────────────────────────────────────────
   useChannable — live marketplace-data voor /dashboards via de
   edge function ccp-dashboard-data (Channable orders + returns,
   30-min servercache in hvl_analytics_cache, key ccp_channable).
   Geen persoonsgegevens in de payload: alleen aggregaten en
   order-id/kanaal/status/bedrag/categorie.
   ───────────────────────────────────────────────────────────── */

export interface ChannableTotals {
  orders_30d: number;
  revenue_30d: number;
  aov: number;
  shipped: number;
  manual: number;
  not_shipped: number;
  cancelled: number;
  problems: number;
  returns: number;
  returns_available: boolean;
}

export interface ChannableData {
  ok?: boolean;
  error?: string;
  generated_at?: string;
  fetched_at?: string;
  cached?: boolean;
  totals?: ChannableTotals;
  per_day?: { date: string; orders: number; revenue: number }[];
  per_channel?: { channel: string; orders: number; revenue: number }[];
  status_breakdown?: Record<string, number>;
  category_breakdown?: Record<string, number>;
  recent_orders?: { id: string; created: string | null; channel: string; status: string; total: number; category: string }[];
  problem_orders?: { id: string; channel: string; reason: string }[];
}

const STATUS_NL: Record<string, string> = {
  shipped: "Verzonden",
  manual: "Handmatig verwerkt",
  not_shipped: "Niet verzonden",
  partial: "Deels verzonden",
  cancelled: "Geannuleerd",
  paid: "Betaald",
  not_paid: "Niet betaald",
  onbekend: "Onbekend",
};
export const channableStatusNL = (s: string) => STATUS_NL[s] ?? s;

export function useChannable(enabled: boolean) {
  const [data, setData] = useState<ChannableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnErr } = await supabase.functions.invoke("ccp-dashboard-data", {
        body: force ? { force: true } : {},
      });
      if (fnErr) throw fnErr;
      const parsed = (typeof res === "string" ? JSON.parse(res) : res) as ChannableData;
      setData(parsed);
      // Backend geeft bij een Channable-storing ok:false + laatste cache mee.
      if (parsed?.ok === false && parsed.error) setError(parsed.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Channable-data niet beschikbaar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  return { data, loading, error, refresh: () => load(true) };
}
