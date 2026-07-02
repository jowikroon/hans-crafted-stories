import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getBlogPost, updateBlogPost } from "@/lib/api/content";
import {
  applyMaskConfigToDom,
  scanMaskTokens,
  MASK_TYPE_LABELS,
  MASK_MODE_LABELS,
  type DomMaskToken,
  type MaskingConfig,
  type MaskMode,
  type MaskType,
} from "@/lib/masking";

/* ────────────────────────────────────────────────────────────
   MaskPanel — per-artikel data-masking in de blog-overlay.

   Zichtbaar voor admins op /writing/:slug wanneer het artikel
   mask-tokens bevat. Regelt:
     • master-toggle (masking aan/uit)
     • per type (cijfers / bedrijven / bureaus / klanten / personen):
       Specifiek | Algemeen | Gemaskeerd
     • per token een override
   Wijzigingen swappen live in de DOM en autosaven (debounced)
   naar blog_posts.masking.
   ──────────────────────────────────────────────────────────── */

const Z = 2147482999;
const MODES: MaskMode[] = ["specific", "general", "masked"];

export default function MaskPanel() {
  const location = useLocation();
  const slug = useMemo(() => {
    const m = location.pathname.match(/^\/writing\/([^/]+)\/?$/);
    return m ? decodeURIComponent(m[1]) : null;
  }, [location.pathname]);

  const [open, setOpen] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [cfg, setCfg] = useState<MaskingConfig>({});
  const [tokens, setTokens] = useState<DomMaskToken[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = useRef<number | null>(null);

  const rescan = useCallback(() => {
    if (typeof document === "undefined") return;
    setTokens(scanMaskTokens(document));
  }, []);

  // Load post + config when the slug changes; rescan tokens after render.
  useEffect(() => {
    setPostId(null);
    setCfg({});
    setTokens([]);
    setSaveState("idle");
    if (!slug) return;
    let alive = true;
    getBlogPost(slug).then((post) => {
      if (!alive || !post) return;
      setPostId(post.id);
      setCfg((post.masking as MaskingConfig) ?? {});
    });
    const t = window.setTimeout(rescan, 600);
    return () => { alive = false; window.clearTimeout(t); };
  }, [slug, rescan]);

  const persist = useCallback((next: MaskingConfig, id: string | null) => {
    if (!id) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = window.setTimeout(async () => {
      try {
        await updateBlogPost(id, { masking: next } as never);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 600);
  }, []);

  const update = useCallback((mutate: (c: MaskingConfig) => MaskingConfig) => {
    setCfg((prev) => {
      const next = mutate(prev);
      if (typeof document !== "undefined") {
        applyMaskConfigToDom(document, next);
        setTokens(scanMaskTokens(document));
      }
      persist(next, postId);
      return next;
    });
  }, [persist, postId]);

  if (!slug) return null;
  if (!open && tokens.length === 0) {
    // Nothing to mask on this article — keep the chrome minimal.
    return null;
  }

  const enabled = cfg.enabled !== false; // default aan zodra er config is; specifiek blijft de fallback-mode
  const presentTypes = Array.from(new Set(tokens.map((t) => t.type))) as MaskType[];

  const mono: React.CSSProperties = { font: '600 10px "IBM Plex Mono", monospace', textTransform: "uppercase", letterSpacing: ".06em", color: "#7E7A6F" };
  const segBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "5px 0", borderRadius: 6, border: "1px solid rgba(0,0,0,.12)",
    background: active ? "#15140F" : "#fff", color: active ? "#FBF8F0" : "#4B4842",
    cursor: "pointer", font: '600 11px "Bricolage Grotesque", system-ui',
  });

  return (
    <>
      <button
        data-edit-ui=""
        onClick={() => { setOpen(!open); if (!open) rescan(); }}
        title="Data-masking voor dit artikel"
        style={{
          position: "fixed", left: 20, bottom: 68, zIndex: Z,
          display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px",
          borderRadius: 100, border: "1px solid rgba(0,0,0,.12)",
          background: open ? "#15140F" : "#FBF8F0", color: open ? "#FBF8F0" : "#15140F",
          font: '600 13px "Bricolage Grotesque", system-ui, sans-serif',
          boxShadow: "0 6px 24px rgba(0,0,0,.18)", cursor: "pointer",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8Z" />
          <circle cx="8" cy="8" r="2" />
          {!enabled && <path d="M2.5 13.5 13.5 2.5" />}
        </svg>
        Data {tokens.length > 0 ? `(${tokens.length})` : ""}
      </button>

      {open && (
        <div
          data-edit-ui=""
          style={{
            position: "fixed", left: 20, bottom: 116, zIndex: Z, width: 320, maxHeight: "70vh", overflowY: "auto",
            background: "#FBF8F0", border: "1px solid rgba(0,0,0,.12)", borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,.22)", padding: 14,
            font: '13px "Bricolage Grotesque", system-ui, sans-serif', color: "#15140F",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ ...mono, margin: 0 }}>Data-masking</p>
            <small style={{ color: saveState === "error" ? "#C2410C" : "#7E7A6F", fontSize: 10 }}>
              {saveState === "saving" ? "Opslaan…" : saveState === "saved" ? "Opgeslagen" : saveState === "error" ? "Opslaan mislukt" : ""}
            </small>
          </div>

          {/* Master toggle */}
          <button
            onClick={() => update((c) => ({ ...c, enabled: !enabled }))}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 11px", borderRadius: 8, border: "1px solid rgba(0,0,0,.12)",
              background: enabled ? "#15140F" : "#fff", color: enabled ? "#FBF8F0" : "#4B4842",
              cursor: "pointer", font: '600 12px "Bricolage Grotesque"', marginBottom: 12,
            }}
          >
            <span>Masking {enabled ? "actief" : "uit — alles zichtbaar"}</span>
            <span style={{ fontSize: 10, opacity: 0.7 }}>{enabled ? "AAN" : "UIT"}</span>
          </button>

          {/* Per-type defaults */}
          {presentTypes.length > 0 && (
            <div style={{ opacity: enabled ? 1 : 0.45, pointerEvents: enabled ? "auto" : "none" }}>
              {presentTypes.map((type) => {
                const cur: MaskMode = cfg.defaults?.[type] ?? "specific";
                return (
                  <div key={type} style={{ marginBottom: 10 }}>
                    <p style={{ ...mono, margin: "0 0 5px" }}>{MASK_TYPE_LABELS[type]}</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      {MODES.map((m) => (
                        <button key={m} style={segBtn(cur === m)}
                          onClick={() => update((c) => ({ ...c, enabled: true, defaults: { ...c.defaults, [type]: m } }))}>
                          {MASK_MODE_LABELS[m]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Per-token overrides */}
              <p style={{ ...mono, margin: "12px 0 5px" }}>Per item</p>
              {tokens.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 11, color: "#4B4842", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={t.variants.specific}>
                    <span style={{ ...mono, fontSize: 9, marginRight: 5 }}>{MASK_TYPE_LABELS[t.type].slice(0, 4)}</span>
                    {t.variants.specific}
                  </span>
                  <select
                    value={cfg.overrides?.[t.id] ?? ""}
                    onChange={(e) => update((c) => {
                      const overrides = { ...c.overrides };
                      if (e.target.value) overrides[t.id] = e.target.value as MaskMode;
                      else delete overrides[t.id];
                      return { ...c, enabled: true, overrides };
                    })}
                    style={{ width: 110, padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(0,0,0,.12)", background: "#fff", fontSize: 11 }}
                  >
                    <option value="">Standaard</option>
                    {MODES.map((m) => <option key={m} value={m}>{MASK_MODE_LABELS[m]}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {tokens.length === 0 && (
            <small style={{ color: "#7E7A6F", fontSize: 11, display: "block" }}>
              Geen mask-tokens in dit artikel. Markeer gevoelige data in de content als{" "}
              <code style={{ fontSize: 10 }}>{"{{m:metric|€67K|~€70K|een fors bedrag}}"}</code>
            </small>
          )}
        </div>
      )}
    </>
  );
}
