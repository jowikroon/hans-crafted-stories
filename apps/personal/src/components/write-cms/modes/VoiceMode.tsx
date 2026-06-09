import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface VoiceRow {
  id: string;
  name: string | null;
  category: string | null;
  is_default: boolean | null;
  banned_words: string[] | null;
  required_elements: string[] | null;
}

const count = (a: unknown): number => (Array.isArray(a) ? a.length : 0);

/**
 * Phase 1 Voice mode: a light, functional list of voice templates that matches
 * the Command Center look. The full inline editor (screenshots 9–10) is folded
 * in during Phase 4; for now "Edit" opens the existing template editor.
 */
export default function VoiceMode() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<VoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("hvl_voice_templates")
      .select("id, name, category, is_default, banned_words, required_elements")
      .order("is_default", { ascending: false })
      .order("name")
      .then(({ data }) => {
        setRows((data ?? []) as VoiceRow[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="shell">
      <main className="main">
        <h1 className="manage-h">Voice<em>.</em></h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-2)", marginTop: 6 }}>
          {loading ? "Loading templates…" : `${rows.length} template${rows.length === 1 ? "" : "s"} · drives drafting & review`}
        </p>

        <div style={{ display: "grid", gap: "var(--s-3)", marginTop: "var(--s-6)" }}>
          {rows.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: "var(--s-4)", padding: "16px 18px",
                background: "var(--bg-1)", border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-2)",
                boxShadow: "var(--shadow-stamp-sm)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{t.name || "Untitled voice"}</span>
                  {t.is_default && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-fg)", background: "var(--accent)", padding: "2px 6px", borderRadius: 4 }}>
                      Default
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-2)", marginTop: 4, letterSpacing: "0.04em" }}>
                  {(t.category || "general").toUpperCase()} · {count(t.banned_words)} banned · {count(t.required_elements)} required
                </div>
              </div>
              <button
                type="button"
                className="stamp-btn stamp-btn--sm"
                onClick={() => navigate(`/blog-cms/voice/${t.id}`)}
              >
                Edit →
              </button>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <p style={{ color: "var(--ink-2)", fontSize: 14 }}>No voice templates yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
