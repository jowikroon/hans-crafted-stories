import { useCallback, useEffect, useRef, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useEditOverlay, keyForElement } from "./EditOverlayProvider";
import { createChangeRequest } from "@/lib/api/overrides";
import { LOGOS } from "@/lib/logos";
import { HEADERS } from "@/lib/headers";
import { FONTS } from "@/lib/fonts";
import { toast } from "sonner";
import MaskPanel from "./MaskPanel";

const UI_ATTR = "data-edit-ui";
const Z = 2147483000;

function isOurUI(el: EventTarget | null): boolean {
  let n = el as HTMLElement | null;
  while (n) {
    if (n.getAttribute && n.getAttribute(UI_ATTR) != null) return true;
    n = n.parentElement;
  }
  return false;
}

export default function EditLayer() {
  const { isAdmin, loading } = useAdmin();
  const { editing, setEditing, select, selectedEl } = useEditOverlay();
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [selRect, setSelRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  // keep selection outline in sync with layout/scroll
  useEffect(() => {
    const update = () => setSelRect(selectedEl ? selectedEl.getBoundingClientRect() : null);
    update();
    if (!selectedEl) return;
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [selectedEl]);

  // The editor UI uses Bricolage Grotesque + IBM Plex Mono. These are no longer in
  // the global <head> (kept off marketing pages), so load them on demand for admins.
  useEffect(() => {
    if (!isAdmin || typeof document === "undefined") return;
    const id = "edit-overlay-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, [isAdmin]);

  // Preload every font-style's webfont so the switcher swatches preview accurately.
  useEffect(() => {
    if (!isAdmin || typeof document === "undefined") return;
    FONTS.forEach((f) =>
      (f.hrefs || []).forEach((href, i) => {
        const id = `edit-font-preview-${f.id}-${i}`;
        if (document.getElementById(id)) return;
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      })
    );
  }, [isAdmin]);

  // hover + click capture while editing
  useEffect(() => {
    if (!editing) {
      setHoverRect(null);
      return;
    }
    const onMove = (e: PointerEvent) => {
      if (isOurUI(e.target)) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setHoverRect(null);
        return;
      }
      const t = e.target as HTMLElement;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setHoverRect(t.getBoundingClientRect()));
    };
    const onClick = (e: MouseEvent) => {
      if (isOurUI(e.target)) return;
      const t = e.target as HTMLElement;
      if (!t || t === document.body || t === document.documentElement) return;
      e.preventDefault();
      e.stopPropagation();
      select(t);
    };
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.body.style.cursor = "crosshair";
    return () => {
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.body.style.cursor = "";
      setHoverRect(null);
    };
  }, [editing, select]);

  if (loading || !isAdmin) return null;

  return (
    <>
      {/* Per-artikel data-masking (alleen op /writing/:slug) */}
      <MaskPanel />

      {/* Floating toggle */}
      <button
        data-edit-ui=""
        onClick={() => {
          setEditing(!editing);
          if (editing) select(null);
        }}
        title={editing ? "Exit edit mode" : "Edit this page"}
        style={{
          position: "fixed",
          left: 20,
          bottom: 20,
          zIndex: Z,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 100,
          border: "1px solid rgba(0,0,0,.12)",
          background: editing ? "#15140F" : "#FBF8F0",
          color: editing ? "#FBF8F0" : "#15140F",
          font: '600 13px "Bricolage Grotesque", system-ui, sans-serif',
          boxShadow: "0 6px 24px rgba(0,0,0,.18)",
          cursor: "pointer",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 14h12M11 3l2 2-7 7H4v-2z" />
        </svg>
        {editing ? "Done" : "Edit"}
      </button>

      {/* Edit-mode chrome */}
      {editing && (
        <>
          {hoverRect && <Outline rect={hoverRect} color="#F5C400" dashed />}
          {selRect && <Outline rect={selRect} color="#C2410C" />}
          <EditPanel />
        </>
      )}
    </>
  );
}

function Outline({ rect, color, dashed }: { rect: DOMRect; color: string; dashed?: boolean }) {
  return (
    <div
      data-edit-ui=""
      style={{
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        border: `2px ${dashed ? "dashed" : "solid"} ${color}`,
        borderRadius: 3,
        pointerEvents: "none",
        zIndex: Z - 1,
        boxSizing: "border-box",
      }}
    />
  );
}

const WEIGHTS = ["400", "500", "600", "700", "800"];
const ALIGNS = ["left", "center", "right"];

function EditPanel() {
  const { selectedEl, selectedKey, overrides, saveStyle, saveText, revert, activeLogoId, setActiveLogo, activeHeaderId, setActiveHeader, activeFontId, setActiveFont } = useEditOverlay();
  const current = selectedKey ? overrides.get(selectedKey) : undefined;
  const [text, setText] = useState("");
  const [instruction, setInstruction] = useState("");
  const [tab, setTab] = useState<"style" | "code">("style");

  useEffect(() => {
    if (!selectedEl) return;
    setText(current?.text_override ?? (selectedEl.textContent || "").trim());
    setInstruction("");
  }, [selectedEl, selectedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const sx = current?.style || {};
  const ipt: React.CSSProperties = {
    width: "100%",
    padding: "7px 9px",
    borderRadius: 6,
    border: "1px solid rgba(0,0,0,.14)",
    background: "#fff",
    font: '13px "Bricolage Grotesque", system-ui, sans-serif',
    color: "#15140F",
    boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = { font: '600 10px "IBM Plex Mono", monospace', textTransform: "uppercase", letterSpacing: ".06em", color: "#7E7A6F", margin: "0 0 5px" };
  const row: React.CSSProperties = { marginBottom: 12 };

  const submitCode = useCallback(async () => {
    if (!instruction.trim()) return;
    try {
      const { key, selector } = selectedEl ? keyForElement(selectedEl) : { key: null, selector: null };
      await createChangeRequest({
        element_key: key,
        selector,
        page_path: window.location.pathname,
        current_html: selectedEl ? selectedEl.outerHTML.slice(0, 4000) : null,
        instruction: instruction.trim(),
      });
      setInstruction("");
      toast.success("Code-change request queued");
    } catch (e) {
      toast.error("Could not queue request");
    }
  }, [instruction, selectedEl]);

  return (
    <aside
      data-edit-ui=""
      style={{
        position: "fixed",
        top: 72,
        right: 16,
        width: 288,
        maxHeight: "calc(100vh - 96px)",
        overflowY: "auto",
        zIndex: Z,
        background: "#F1ECDF",
        border: "1px solid rgba(0,0,0,.14)",
        borderRadius: 12,
        boxShadow: "0 12px 40px rgba(0,0,0,.22)",
        padding: 14,
        font: '13px "Bricolage Grotesque", system-ui, sans-serif',
        color: "#15140F",
      }}
    >
      {/* ── Permanent: Header logo switcher (site-wide) ── */}
      <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(0,0,0,.10)" }}>
        <p style={{ font: '600 10px "IBM Plex Mono", monospace', textTransform: "uppercase", letterSpacing: ".06em", color: "#7E7A6F", margin: "0 0 7px" }}>Header logo</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LOGOS.map((l) => {
            const active = l.id === activeLogoId;
            return (
              <button
                key={l.id}
                data-edit-ui=""
                onClick={() => setActiveLogo(l.id)}
                title={l.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  padding: 7,
                  borderRadius: 10,
                  cursor: "pointer",
                  border: active ? "2px solid #2D9255" : "1px solid rgba(0,0,0,.14)",
                  background: active ? "#E7F2EA" : "#fff",
                }}
              >
                <img src={l.src} alt={l.label} width={36} height={36} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain", background: "#fff" }} />
                <span style={{ font: '600 10px "Bricolage Grotesque", system-ui', color: active ? "#2D9255" : "#4B4842", maxWidth: 64, textAlign: "center", lineHeight: 1.2 }}>{l.label}</span>
              </button>
            );
          })}
        </div>
        <small style={{ display: "block", marginTop: 8, color: "#7E7A6F", fontSize: 10 }}>
          Applies site-wide for every visitor. Add more logos in <code>src/lib/logos.ts</code>.
        </small>
      </div>
      {/* ── Permanent: Header style switcher (site-wide) ── */}
      <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(0,0,0,.10)" }}>
        <p style={{ font: '600 10px "IBM Plex Mono", monospace', textTransform: "uppercase", letterSpacing: ".06em", color: "#7E7A6F", margin: "0 0 7px" }}>Header style</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {HEADERS.map((h) => {
            const active = h.id === activeHeaderId;
            return (
              <button
                key={h.id}
                data-edit-ui=""
                onClick={() => setActiveHeader(h.id)}
                title={h.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  padding: 7,
                  borderRadius: 10,
                  cursor: "pointer",
                  border: active ? "2px solid #2D9255" : "1px solid rgba(0,0,0,.14)",
                  background: active ? "#E7F2EA" : "#fff",
                }}
              >
                <HeaderSwatch id={h.id} />
                <span style={{ font: '600 10px "Bricolage Grotesque", system-ui', color: active ? "#2D9255" : "#4B4842", maxWidth: 64, textAlign: "center", lineHeight: 1.2 }}>{h.label}</span>
              </button>
            );
          })}
        </div>
        <small style={{ display: "block", marginTop: 8, color: "#7E7A6F", fontSize: 10 }}>
          Applies site-wide. Add more in <code>src/lib/headers.ts</code>.
        </small>
      </div>

      {/* ── Permanent: Font switcher (site-wide) ── */}
      <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(0,0,0,.10)" }}>
        <p style={{ font: '600 10px "IBM Plex Mono", monospace', textTransform: "uppercase", letterSpacing: ".06em", color: "#7E7A6F", margin: "0 0 7px" }}>Font</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FONTS.map((f) => {
            const active = f.id === activeFontId;
            return (
              <button
                key={f.id}
                data-edit-ui=""
                onClick={() => setActiveFont(f.id)}
                title={f.pairing}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  padding: 7,
                  borderRadius: 10,
                  cursor: "pointer",
                  width: 84,
                  border: active ? "2px solid #2D9255" : "1px solid rgba(0,0,0,.14)",
                  background: active ? "#E7F2EA" : "#fff",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "#FBF8F0", border: "1px solid rgba(0,0,0,.08)", fontFamily: f.display, fontSize: 20, lineHeight: 1, color: "#15140F" }}>Aa</span>
                <span style={{ font: '600 10px "Bricolage Grotesque", system-ui', color: active ? "#2D9255" : "#4B4842", textAlign: "center", lineHeight: 1.2 }}>{f.label}</span>
                <span style={{ fontFamily: f.body, fontSize: 8.5, color: "#7E7A6F", textAlign: "center", lineHeight: 1.15, maxWidth: 76 }}>{f.pairing}</span>
              </button>
            );
          })}
        </div>
        <small style={{ display: "block", marginTop: 8, color: "#7E7A6F", fontSize: 10 }}>
          Applies site-wide — main + sub font per style. Add more in <code>src/lib/fonts.ts</code>.
        </small>
      </div>

      {!selectedEl ? (
        <p style={{ margin: 0, color: "#7E7A6F" }}>Click any element on the page to edit it.</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {(["style", "code"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: 6,
                  border: "1px solid rgba(0,0,0,.12)",
                  background: tab === t ? "#15140F" : "transparent",
                  color: tab === t ? "#FBF8F0" : "#4B4842",
                  font: '600 12px "Bricolage Grotesque", system-ui',
                  cursor: "pointer",
                }}
              >
                {t === "style" ? "Tweak" : "Code change"}
              </button>
            ))}
          </div>

          {tab === "style" ? (
            <>
              <div style={row}>
                <p style={lbl}>Text</p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onBlur={() => saveText(text)}
                  rows={3}
                  style={{ ...ipt, resize: "vertical" }}
                />
                <small style={{ color: "#7E7A6F", fontSize: 10 }}>Best-effort for hardcoded text — permanent text → use “Code change”.</small>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ ...row, flex: 1 }}>
                  <p style={lbl}>Color</p>
                  <input type="color" value={asColor(sx.color)} onChange={(e) => saveStyle({ color: e.target.value })} style={{ ...ipt, height: 34, padding: 2 }} />
                </div>
                <div style={{ ...row, flex: 1 }}>
                  <p style={lbl}>Background</p>
                  <input type="color" value={asColor(sx.backgroundColor)} onChange={(e) => saveStyle({ backgroundColor: e.target.value })} style={{ ...ipt, height: 34, padding: 2 }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ ...row, flex: 1 }}>
                  <p style={lbl}>Font size</p>
                  <input placeholder="e.g. 18px" defaultValue={sx.fontSize ?? ""} onBlur={(e) => saveStyle({ fontSize: e.target.value })} style={ipt} />
                </div>
                <div style={{ ...row, flex: 1 }}>
                  <p style={lbl}>Weight</p>
                  <select value={sx.fontWeight ?? ""} onChange={(e) => saveStyle({ fontWeight: e.target.value })} style={ipt}>
                    <option value="">—</option>
                    {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              <div style={row}>
                <p style={lbl}>Align</p>
                <div style={{ display: "flex", gap: 4 }}>
                  {ALIGNS.map((a) => (
                    <button key={a} onClick={() => saveStyle({ textAlign: a })}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "1px solid rgba(0,0,0,.12)", background: sx.textAlign === a ? "#15140F" : "#fff", color: sx.textAlign === a ? "#FBF8F0" : "#4B4842", cursor: "pointer", font: "12px system-ui" }}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ ...row, flex: 1 }}>
                  <p style={lbl}>Margin Y</p>
                  <input placeholder="e.g. 24px" defaultValue={sx.marginTop ?? ""} onBlur={(e) => saveStyle({ marginTop: e.target.value, marginBottom: e.target.value })} style={ipt} />
                </div>
                <div style={{ ...row, flex: 1 }}>
                  <p style={lbl}>Padding Y</p>
                  <input placeholder="e.g. 16px" defaultValue={sx.paddingTop ?? ""} onBlur={(e) => saveStyle({ paddingTop: e.target.value, paddingBottom: e.target.value })} style={ipt} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => saveStyle({ display: sx.display === "none" ? "" : "none" })}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "1px solid rgba(0,0,0,.12)", background: "#fff", color: "#4B4842", cursor: "pointer", font: '600 12px "Bricolage Grotesque"' }}>
                  {sx.display === "none" ? "Show" : "Hide"}
                </button>
                <button onClick={() => revert()}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "1px solid rgba(194,65,12,.4)", background: "#fff", color: "#C2410C", cursor: "pointer", font: '600 12px "Bricolage Grotesque"' }}>
                  Revert
                </button>
              </div>
            </>
          ) : (
            <div style={row}>
              <p style={lbl}>Describe the structural change</p>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={5}
                placeholder="e.g. Make this a 2-column grid and add a CTA button below the heading."
                style={{ ...ipt, resize: "vertical" }}
              />
              <button onClick={submitCode} disabled={!instruction.trim()}
                style={{ width: "100%", marginTop: 8, padding: "9px 0", borderRadius: 6, border: 0, background: instruction.trim() ? "#15140F" : "#cfc8b6", color: "#FBF8F0", cursor: instruction.trim() ? "pointer" : "default", font: '600 13px "Bricolage Grotesque"' }}>
                Queue code change → PR
              </button>
              <small style={{ display: "block", marginTop: 8, color: "#7E7A6F", fontSize: 10 }}>
                Captures the element + your instruction into the dispatch queue (Linear → n8n → Claude Code → PR). Merge stays manual.
              </small>
            </div>
          )}
        </>
      )}
    </aside>
  );
}

/** Tiny inline preview of a header design for the editor switcher. */
function HeaderSwatch({ id }: { id: string }) {
  const dark = id === "dnav";
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: dark ? "flex-start" : "center",
        gap: 4,
        width: 56,
        height: 22,
        padding: "0 6px",
        boxSizing: "border-box",
        borderRadius: dark ? 5 : 100,
        background: dark ? "#15140F" : "#FBF8F0",
        border: dark ? "1px solid rgba(255,255,255,.12)" : "1px solid rgba(0,0,0,.14)",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: dark ? "#F5C400" : "#2D9255",
          flexShrink: 0,
        }}
      />
    </span>
  );
}

function asColor(v?: string): string {
  if (!v) return "#000000";
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  return "#000000";
}
