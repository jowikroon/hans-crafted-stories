// useAnalyticsLive — Phase E hook for the live GA4 + Search Console view.
//
// Reads from three additive tables (see migration 20260526_analytics_live.sql):
//
//   public.analytics_daily
//     ├── id uuid PK
//     ├── source text (= 'ga4' | 'gsc')
//     ├── date date  (UTC day boundary)
//     ├── post_id uuid NULL  (joins blog_posts.id — NULL = site-wide row)
//     ├── sessions int NULL    (GA4)
//     ├── pageviews int NULL   (GA4)
//     ├── impressions int NULL (GSC)
//     ├── clicks int NULL      (GSC)
//     ├── ctr numeric NULL     (GSC; 0–1)
//     ├── avg_position numeric NULL (GSC)
//     ├── inserted_at timestamptz
//     └── synced_at timestamptz
//
//   public.analytics_search_terms
//     ├── id uuid PK
//     ├── post_id uuid NULL
//     ├── query text
//     ├── period_start date, period_end date
//     ├── impressions int, clicks int, ctr numeric, avg_position numeric
//     └── synced_at timestamptz
//
//   public.analytics_insights
//     ├── id uuid PK
//     ├── period text (= '7d' | '30d' | '90d')
//     ├── kind text  (= 'up' | 'warn' | 'idea')
//     ├── headline text
//     ├── body text NULL
//     ├── model text (= 'claude-haiku-4-5' typical)
//     ├── created_at timestamptz
//     └── superseded_at timestamptz NULL  (NULL = current)
//
// Until a connector job populates these tables, the hook returns empty state
// and AnalyticsMode falls back to the existing blog_posts aggregates panel.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AnalyticsRange = "7d" | "30d" | "90d";

export interface ConnectorState {
  source: "ga4" | "gsc";
  configured: boolean;
  lastSyncedAt: string | null;
}

export interface SessionsPoint {
  date: string;
  sessions: number;
  pageviews: number;
}

export interface TopPost {
  postId: string;
  title: string;
  sessions: number;
  trend: number;
}

export interface SearchTerm {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface Insight {
  id: string;
  kind: "up" | "warn" | "idea";
  headline: string;
  body: string | null;
}

export interface AnalyticsLiveState {
  loading: boolean;
  connectors: ConnectorState[];
  sessions: SessionsPoint[];
  topPosts: TopPost[];
  searchTerms: SearchTerm[];
  insights: Insight[];
  /** True when ANY connector has produced rows in `analytics_daily`. */
  hasLiveData: boolean;
  /** Truthy when something failed; not user-facing today. */
  error: string | null;
  /** Refresh manually. */
  refresh: () => Promise<void>;
}

function daysAgoISO(days: number): string {
  const d = new Date(Date.now() - days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function pickRangeDays(range: AnalyticsRange): number {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  return 90;
}

/** Read connector state by checking for any rows + the freshest synced_at. */
async function readConnectors(): Promise<ConnectorState[]> {
  const sb = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> };
  const ga4 = await sb.from("analytics_daily").select("synced_at").eq("source", "ga4").order("synced_at", { ascending: false }).limit(1) as { data: { synced_at: string }[] | null };
  const gsc = await sb.from("analytics_daily").select("synced_at").eq("source", "gsc").order("synced_at", { ascending: false }).limit(1) as { data: { synced_at: string }[] | null };
  return [
    { source: "ga4", configured: !!ga4.data?.length, lastSyncedAt: ga4.data?.[0]?.synced_at ?? null },
    { source: "gsc", configured: !!gsc.data?.length, lastSyncedAt: gsc.data?.[0]?.synced_at ?? null },
  ];
}

async function readSessions(range: AnalyticsRange): Promise<SessionsPoint[]> {
  const since = daysAgoISO(pickRangeDays(range));
  const sb = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> };
  const { data } = await sb
    .from("analytics_daily")
    .select("date,sessions,pageviews")
    .eq("source", "ga4")
    .is("post_id", null)
    .gte("date", since)
    .order("date", { ascending: true }) as { data: { date: string; sessions: number | null; pageviews: number | null }[] | null };
  if (!data) return [];
  return data.map((r) => ({
    date: r.date,
    sessions: r.sessions ?? 0,
    pageviews: r.pageviews ?? 0,
  }));
}

async function readTopPosts(range: AnalyticsRange): Promise<TopPost[]> {
  const days = pickRangeDays(range);
  const sinceCurrent = daysAgoISO(days);
  const sincePrev = daysAgoISO(days * 2);
  const sb = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> };
  const { data } = await sb
    .from("analytics_daily")
    .select("post_id,sessions,date")
    .eq("source", "ga4")
    .not("post_id", "is", null)
    .gte("date", sincePrev) as { data: { post_id: string; sessions: number | null; date: string }[] | null };
  if (!data || data.length === 0) return [];

  const cur: Record<string, number> = {};
  const prev: Record<string, number> = {};
  for (const row of data) {
    const s = row.sessions ?? 0;
    if (row.date >= sinceCurrent) cur[row.post_id] = (cur[row.post_id] ?? 0) + s;
    else prev[row.post_id] = (prev[row.post_id] ?? 0) + s;
  }
  const ids = Object.keys(cur);
  if (ids.length === 0) return [];

  const { data: titles } = await sb
    .from("blog_posts")
    .select("id,title")
    .in("id", ids) as { data: { id: string; title: string }[] | null };
  const titleById = new Map((titles ?? []).map((t) => [t.id, t.title]));

  return ids
    .map((id) => {
      const sessions = cur[id] ?? 0;
      const prevSessions = prev[id] ?? 0;
      const trend = prevSessions === 0 ? (sessions > 0 ? 100 : 0) : Math.round(((sessions - prevSessions) / prevSessions) * 100);
      return { postId: id, title: titleById.get(id) ?? "(missing)", sessions, trend };
    })
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8);
}

async function readSearchTerms(range: AnalyticsRange): Promise<SearchTerm[]> {
  const since = daysAgoISO(pickRangeDays(range));
  const sb = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> };
  const { data } = await sb
    .from("analytics_search_terms")
    .select("query,impressions,clicks,ctr,avg_position,period_end")
    .gte("period_end", since)
    .order("impressions", { ascending: false })
    .limit(10) as { data: { query: string; impressions: number; clicks: number; ctr: number; avg_position: number }[] | null };
  if (!data) return [];
  return data.map((r) => ({
    query: r.query,
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: r.ctr,
    position: r.avg_position,
  }));
}

async function readInsights(range: AnalyticsRange): Promise<Insight[]> {
  const sb = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> };
  const { data } = await sb
    .from("analytics_insights")
    .select("id,kind,headline,body")
    .eq("period", range)
    .is("superseded_at", null)
    .order("created_at", { ascending: false })
    .limit(3) as { data: { id: string; kind: "up" | "warn" | "idea"; headline: string; body: string | null }[] | null };
  return data ?? [];
}

export function useAnalyticsLive(range: AnalyticsRange): AnalyticsLiveState {
  const [loading, setLoading] = useState(true);
  const [connectors, setConnectors] = useState<ConnectorState[]>([
    { source: "ga4", configured: false, lastSyncedAt: null },
    { source: "gsc", configured: false, lastSyncedAt: null },
  ]);
  const [sessions, setSessions] = useState<SessionsPoint[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, s, t, st, ins] = await Promise.all([
        readConnectors(),
        readSessions(range),
        readTopPosts(range),
        readSearchTerms(range),
        readInsights(range),
      ]);
      setConnectors(c);
      setSessions(s);
      setTopPosts(t);
      setSearchTerms(st);
      setInsights(ins);
    } catch (err) {
      // Tables likely don't exist yet — silently keep empty state, log to console.
      setError(err instanceof Error ? err.message : "Analytics load failed");
      // eslint-disable-next-line no-console
      console.warn("[useAnalyticsLive] non-fatal:", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasLiveData = useMemo(
    () => sessions.length > 0 || topPosts.length > 0 || searchTerms.length > 0,
    [sessions, topPosts, searchTerms],
  );

  return { loading, connectors, sessions, topPosts, searchTerms, insights, hasLiveData, error, refresh };
}
