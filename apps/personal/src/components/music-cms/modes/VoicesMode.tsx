import { useRef, useState } from "react";
import { MASTER_PROMPT, VOICE_TEMPLATES } from "../voiceTemplates";

/**
 * Voices — read view of the 8 artist voice templates (methodologie +
 * deep_analysis vereiste) en de volledige Master Prompt, met copy-knoppen.
 */
export default function VoicesMode() {
  const [openId, setOpenId] = useState<string | null>(VOICE_TEMPLATES[0]?.id ?? null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <main className="main manage-main">
      <h1 className="manage-h">Voices<em>.</em></h1>
      <div className="manage-stats">
        <strong>{VOICE_TEMPLATES.length}</strong> voice templates
        <span className="sep">·</span>
        schrijfprocessen, geen imitaties
      </div>

      <div className="mc-voice-list">
        {VOICE_TEMPLATES.map((t) => {
          const open = openId === t.id;
          return (
            <div key={t.id} className={`mc-voice${open ? " open" : ""}`}>
              <button type="button" className="mc-voice-head" onClick={() => setOpenId(open ? null : t.id)}>
                <span className="tpl-artist">{t.artist}</span>
                <span className="tpl-name">{t.name}</span>
                <span className="tpl-tagline">{t.tagline}</span>
              </button>
              {open && (
                <div className="mc-voice-body">
                  <pre className="mc-pre mc-pre--method">{t.methodology}</pre>
                  <p className="mc-rail-note">
                    <strong>deep_analysis:</strong> {t.analysisInstruction}
                  </p>
                  <button
                    className="stamp-btn stamp-btn--ghost stamp-btn--sm"
                    onClick={() => copy(t.id, t.methodology)}
                  >
                    {copiedId === t.id ? "Gekopieerd ✓" : "Kopieer methodologie"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="mc-section-h" style={{ marginTop: "var(--s-6)" }}>
        Master Prompt (system_setup)
        <button className="mc-toggle" onClick={() => copy("master", MASTER_PROMPT)}>
          {copiedId === "master" ? "gekopieerd ✓" : "kopieer"}
        </button>
      </h2>
      <pre className="mc-pre mc-pre--master">{MASTER_PROMPT}</pre>
    </main>
  );
}
