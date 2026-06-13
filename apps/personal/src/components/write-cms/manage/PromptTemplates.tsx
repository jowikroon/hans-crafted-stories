import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// ─── Prompt templates rail (design contract B1) ──────────────────────────────
// 6 cards, each a content shape. Type 3 words → Claude writes a skeleton draft in
// that shape → saved as a draft via the ghost-write pipeline contract → open in editor.

interface Tpl { key: string; name: string; shape: string; angle: string }

const TEMPLATES: Tpl[] = [
  { key: "hook", name: "De haak", shape: "Eén scherpe claim → bewijs → implicatie", angle: "Open met een tegendraadse stelling en bouw die in 600 woorden uit met data en één praktijkvoorbeeld." },
  { key: "contra", name: "Tegen de stroom", shape: "Wat iedereen gelooft ↔ wat jij ziet", angle: "Neem een breed gedeelde aanname in NL e-commerce en weerleg die met je eigen ervaring." },
  { key: "failures", name: "Faalmodi", shape: "3-4 manieren waarop het misgaat + fix", angle: "Lijst de meest voorkomende fouten rond dit onderwerp en geef per fout de concrete fix." },
  { key: "diary", name: "Uit de praktijk", shape: "Gedateerde observatie → les", angle: "Schrijf vanuit een concrete situatie (klant, kwartaal, cijfer) naar een algemene les." },
  { key: "vs", name: "X vs Y", shape: "Vergelijking met duidelijke keuze", angle: "Vergelijk twee opties objectief met een framework en eindig met een heldere aanbeveling." },
  { key: "quiet", name: "De stille waarheid", shape: "Nuance die de meesten missen", angle: "Behandel een onderbelicht detail dat in de praktijk het verschil maakt." },
];

export default function PromptTemplates({ category = "professional" }: { category?: string }) {
  const navigate = useNavigate();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [words, setWords] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const toggle = useCallback((key: string) => {
    setError(null);
    setOpenKey((cur) => {
      const next = cur === key ? null : key;
      if (next) setTimeout(() => inputRef.current?.focus(), 60);
      return next;
    });
  }, []);

  const run = useCallback(async (tpl: Tpl) => {
    const topic = words.trim();
    if (!topic) { setError("Geef 3 woorden als onderwerp."); return; }
    setBusy(tpl.key);
    setError(null);
    try {
      const res = await fetch("https://n8n.srv1402218.hstgr.cloud/webhook/blog-ghost-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: topic,
          language: "nl",
          category,
          cluster: "autoriteit",
          proposed_angle: `${tpl.name} — ${tpl.angle}`,
          brand_voice_context: `Schrijf in de vorm: ${tpl.shape}. ${tpl.angle}`,
          narrative_history: "",
          source: "blog-cms-prompt-template",
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`ghost-write HTTP ${res.status}${body ? `: ${body.slice(0, 100)}` : ""}`);
      }
      const d = await res.json();
      if (d.error) throw new Error(String(d.error));
      if (d.post_id) navigate(`/write/${d.post_id}`);
      else { setWords(""); setOpenKey(null); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Genereren mislukt");
    } finally {
      setBusy(null);
    }
  }, [words, category, navigate]);

  return (
    <div className="pt-rail">
      <div className="pt-rail-head">
        <span className="pt-rail-title">3 woorden → volledige draft</span>
        <span className="pt-rail-sub">kies een vorm, typ je onderwerp</span>
      </div>
      <div className="pt-cards">
        {TEMPLATES.map((t) => (
          <div key={t.key} className={`pt-card${openKey === t.key ? " open" : ""}`}>
            <button className="pt-card-head" onClick={() => toggle(t.key)}>
              <span className="pt-card-name">{t.name}</span>
              <span className="pt-card-shape">{t.shape}</span>
            </button>
            {openKey === t.key && (
              <div className="pt-card-body">
                <input
                  ref={inputRef}
                  className="pt-input"
                  value={words}
                  onChange={(e) => setWords(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") run(t); }}
                  placeholder="bv. amazon retouren kosten"
                  disabled={!!busy}
                />
                <button className="stamp-btn stamp-btn--sm" onClick={() => run(t)} disabled={!!busy}>
                  {busy === t.key ? "⟳ Schrijven…" : "▸ Genereer"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {error && <div className="pt-error">{error}</div>}
    </div>
  );
}
