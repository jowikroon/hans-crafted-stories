import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Search Console briefs in de Write-rail (design contract A11) ────────────
// Pakt de GSC-queries uit de analytics-cache en toont de kansen (hoge impressies,
// matige positie) als schrijf-briefs: "schrijf hierover om te stijgen".

interface Query { query: string; clicks: number; impressions: number; ctr: number | null; position: number | null }

export default function SCBriefs() {
  const [briefs, setBriefs] = useState<Query[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("hvl_analytics_cache")
      .select("data")
      .eq("key", "dashboard")
      .maybeSingle()
      .then(({ data }) => {
        const queries: Query[] = (data?.data as { gsc?: { queries?: Query[] } })?.gsc?.queries ?? [];
        // Kansen: veel impressies, positie 5-20 (net buiten top — schrijven helpt).
        const opp = queries
          .filter((q) => (q.impressions ?? 0) >= 20 && (q.position ?? 0) >= 5 && (q.position ?? 0) <= 20)
          .sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))
          .slice(0, 5);
        setBriefs(opp.length ? opp : queries.slice(0, 5));
        setLoaded(true);
      });
  }, []);

  if (!loaded || briefs.length === 0) return null;

  return (
    <div className="card sc-briefs">
      <div className="card-head">Search Console briefs<span>{briefs.length}</span></div>
      <div className="sc-briefs-list">
        {briefs.map((q) => (
          <div key={q.query} className="sc-brief">
            <div className="sc-brief-q">{q.query}</div>
            <div className="sc-brief-meta">
              {(q.impressions ?? 0).toLocaleString()} impr · pos #{q.position != null ? Math.round(q.position) : "–"}
              {(q.position ?? 0) >= 5 && (q.position ?? 0) <= 20 && <span className="sc-brief-tag"> · kans</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="sc-briefs-foot">Hoge impressies + matige positie = schrijf hierover om te stijgen.</div>
    </div>
  );
}
