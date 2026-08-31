// useInfraHeartbeats — leest public.infra_service_heartbeats (RLS: SELECT voor
// authenticated; de /write-sessie is ingelogd via useAuth, dus de bestaande
// client volstaat). Elke service op elke host schrijft elke ~2 min een rij:
//
//   public.infra_service_heartbeats
//     ├── host text        (bv. 'pi5')
//     ├── service text     (bv. 'ollama', 'samantha-brain', '_host')
//     ├── status text      ('up' | 'down' | 'degraded')
//     ├── detail jsonb     (ollama: {api,models} · _host: {mem_free_mb,disk_free_mb,cpu_temp_c})
//     └── reported_at timestamptz   — PK (host, service)
//
// KERNREGEL (leeftijd is waarheid): de hook levert rauwe rijen + refresh;
// de leeftijdsinterpretatie (< 5 min = geldig) gebeurt in InfraStatusCard.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeartbeatDetail {
  api?: string;
  models?: number;
  mem_free_mb?: number;
  disk_free_mb?: number;
  cpu_temp_c?: number;
  [key: string]: unknown;
}

export interface HeartbeatRow {
  host: string;
  service: string;
  status: string; // 'up' | 'down' | 'degraded' — als tekst, bron is niet ge-enum'd
  detail: HeartbeatDetail | null;
  reported_at: string;
}

export interface InfraHeartbeatsState {
  rows: HeartbeatRow[];
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  refresh: () => void;
}

const REFRESH_MS = 60_000;

export function useInfraHeartbeats(): InfraHeartbeatsState {
  const [rows, setRows] = useState<HeartbeatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      // Tabel staat (nog) niet in de gegenereerde Database-types; de untyped
      // from(string)-overload is hetzelfde patroon als hvl_analytics_cache
      // in AnalyticsMode.
      const { data, error: qError } = await supabase
        .from("infra_service_heartbeats")
        .select("host, service, status, detail, reported_at");
      if (qError) {
        setError(qError.message);
        setRows([]);
      } else {
        setError(null);
        setRows((data ?? []) as HeartbeatRow[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRows([]);
    } finally {
      setLastRefreshed(new Date());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return { rows, loading, error, lastRefreshed, refresh: load };
}
