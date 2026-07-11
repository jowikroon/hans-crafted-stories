import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Hero-image tool (design contract A2 / C3) ───────────────────────────────
// Empty-state hero card + Gemini image-tool modal: style-chips, prompt, locked
// house-style note, variants, insert. Persists the chosen URL to blog_posts
// (image_url + og_image) via the anon-insert path (Hans is authenticated → admin RLS).

const STYLES: { key: string; label: string }[] = [
  { key: "editorial", label: "Editorial" },
  { key: "technical", label: "Technical" },
  { key: "abstract", label: "Abstract" },
  { key: "duotone", label: "Duotone" },
  { key: "minimal", label: "Minimal" },
  { key: "riso", label: "Riso" },
  { key: "geo", label: "Geometric" },
  { key: "newsprint", label: "Newsprint" },
  { key: "swiss", label: "Swiss" },
];

interface Variant { url: string; generated: boolean }

export default function HeroImageTool({
  postId,
  title,
  currentImage,
  onSaved,
}: {
  postId: string;
  title: string;
  currentImage: string | null;
  onSaved: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState("editorial");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const subject = (prompt.trim() || title || "").slice(0, 800);

  const generate = useCallback(async () => {
    if (!subject) { setError("Geef een onderwerp of titel."); return; }
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("blog-hero-image", {
        body: { subject, style, count: 3 },
      });
      if (fnErr) throw new Error(fnErr.message);
      const d = (data ?? {}) as { variants?: Variant[]; note?: string; error?: string };
      if (d.error) throw new Error(d.error);
      setVariants(d.variants ?? []);
      setNote(d.note ?? null);
      setPicked(d.variants?.[0]?.url ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Genereren mislukt");
    } finally {
      setBusy(false);
    }
  }, [subject, style]);

  const insert = useCallback(async () => {
    if (!picked) return;
    setSaving(true);
    setError(null);
    try {
      const { error: upErr } = await supabase
        .from("blog_posts")
        .update({ image_url: picked, og_image: picked })
        .eq("id", postId);
      if (upErr) throw new Error(upErr.message);
      onSaved(picked);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  }, [picked, postId, onSaved]);

  return (
    <>
      {/* ── Hero card ── */}
      {currentImage ? (
        <div className="hero-image filled" onClick={() => setOpen(true)} title="Klik om te wijzigen">
          <img src={currentImage} alt="" />
          <span className="edit-chip">Edit image</span>
          <span className="style-tag">Editorial · amber accent</span>
        </div>
      ) : (
        <div className="hero-image empty" onClick={() => setOpen(true)}>
          <div className="empty-cta">
            <span className="glyph">✦</span>
            <span className="empty-cta-title">Add a hero image</span>
            <span className="empty-cta-sub">generated with gemini · always editorial</span>
          </div>
        </div>
      )}

      {/* ── Image-tool modal ── */}
      {open && (
        <div className="it-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !busy && !saving) setOpen(false); }}>
          <div className="it-modal">
            <div className="it-head">
              <div>
                <div className="it-eyebrow">Hero image · Gemini · style-locked</div>
                <div className="it-title">Genereer <em>cover</em></div>
              </div>
              <button className="it-close" onClick={() => setOpen(false)}>×</button>
            </div>

            <div className="it-body">
              {/* Preview / variants */}
              <div className="it-preview">
                {busy ? (
                  <div className="it-frame shimmer" />
                ) : variants.length ? (
                  <img className="it-frame" src={picked ?? variants[0].url} alt="" />
                ) : (
                  <div className="it-frame empty"><span>Nog geen cover, beschrijf en genereer</span></div>
                )}
                {variants.length > 1 && (
                  <div className="it-variant-row">
                    {variants.map((v, i) => (
                      <button
                        key={v.url}
                        className={`it-variant${picked === v.url ? " on" : ""}`}
                        onClick={() => setPicked(v.url)}
                        title={v.generated ? "Gemini" : "placeholder"}
                      >
                        <img src={v.url} alt="" />
                        <span className="it-variant-n">{i + 1}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Controls */}
              <label className="it-field">
                <span className="it-field-lab">Beschrijf de cover (leeg = artikeltitel)</span>
                <textarea
                  className="it-prompt"
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={title || "bv. Amazon vs Bol.com, marktaandeel in 2026"}
                />
              </label>

              <div className="it-field-lab">Stijl</div>
              <div className="it-style-chips">
                {STYLES.map((s) => (
                  <button key={s.key} className={`it-style${style === s.key ? " on" : ""}`} onClick={() => setStyle(s.key)}>
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="it-guard">
                🔒 System prompt locked, warm cream + black + amber <b>#F5C400</b>, editorial line-art, no photorealism, 16:9.
              </div>

              {note && <div className="it-note">{note}</div>}
              {error && <div className="it-error">{error}<button onClick={() => setError(null)}>×</button></div>}
            </div>

            <div className="it-foot">
              <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={generate} disabled={busy}>
                {busy ? "⟳ Genereren…" : variants.length ? "Opnieuw" : "Generate"}
              </button>
              <button className="stamp-btn" onClick={insert} disabled={!picked || saving}>
                {saving ? "Opslaan…" : "Insert at top →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
