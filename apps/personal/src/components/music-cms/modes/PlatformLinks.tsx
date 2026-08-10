// PlatformLinks — de vier platformknoppen (Spotify / SoundCloud / Suno /
// NeuralAnalog) per nummer. Uit: dof in de eigen merkkleur. Aan: subtiel
// neon-licht dat "opgloeit", met een korte indruk-animatie bij het klikken.
// Ontbreekt een link, dan staat de knop uit en kun je 'm hier meteen invoeren.
import { memo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { safeHttpUrl, type TrackUrlField } from "../lib/trackStore";

export type PlatformId = "spotify" | "soundcloud" | "suno" | "neuralanalog";

interface PlatformDef {
  id: PlatformId;
  label: string;
  field: TrackUrlField;
  hint: string;
  icon: JSX.Element;
}

/* Merk-iconen als paden, zodat we geen extra dependency nodig hebben. */
const PLATFORMS: PlatformDef[] = [
  {
    id: "spotify",
    label: "Spotify",
    field: "spotify_url",
    hint: "Uitgebracht op Spotify",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 1 1-.277-1.215c3.809-.871 7.077-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.223-2.722a.78.78 0 0 1-1.072.257c-2.688-1.652-6.786-2.131-9.965-1.166a.78.78 0 0 1-.452-1.492c3.632-1.102 8.147-.568 11.234 1.329a.78.78 0 0 1 .255 1.072zm.105-2.835a.935.935 0 0 1-1.285.31c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 1 1-.542-1.79c3.532-1.072 9.404-.865 13.115 1.338a.935.935 0 0 1 .33 1.298z" />
      </svg>
    ),
  },
  {
    id: "soundcloud",
    label: "SoundCloud",
    field: "soundcloud_url",
    hint: "Verwerkte versie op SoundCloud",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M1.5 13.2c-.1 0-.2.1-.2.2l-.2 1.8.2 1.7c0 .1.1.2.2.2s.2-.1.2-.2l.2-1.7-.2-1.8c0-.1-.1-.2-.2-.2zm1.6-.9c-.1 0-.2.1-.2.2l-.3 2.9.3 2.7c0 .1.1.2.2.2s.2-.1.2-.2l.3-2.7-.3-2.9c0-.1-.1-.2-.2-.2zm1.7-.6c-.1 0-.3.1-.3.3l-.2 3.4.2 2.7c0 .2.1.3.3.3s.3-.1.3-.3l.3-2.7-.3-3.4c0-.2-.1-.3-.3-.3zm1.8-.2c-.2 0-.3.1-.3.3l-.2 3.6.2 2.6c0 .2.1.3.3.3s.3-.1.3-.3l.3-2.6-.3-3.6c0-.2-.1-.3-.3-.3zm1.8.3c-.2 0-.3.2-.3.3l-.2 3.3.2 2.6c0 .2.2.3.3.3.2 0 .3-.2.3-.3l.2-2.6-.2-3.3c0-.2-.1-.3-.3-.3zm1.9-2.6c-.2 0-.4.2-.4.4l-.2 5.5.2 2.6c0 .2.2.4.4.4s.4-.2.4-.4l.2-2.6-.2-5.5c0-.2-.2-.4-.4-.4zm1.9-.7c-.2 0-.4.2-.4.4l-.2 6.2.2 2.5c0 .2.2.4.4.4s.4-.2.4-.4l.2-2.5-.2-6.2c0-.2-.2-.4-.4-.4zm2-.3c-.2 0-.4.2-.4.4l-.1 6.5.1 2.5c0 .2.2.4.4.4.2 0 .4-.2.4-.4l.2-2.5-.2-6.5c0-.2-.2-.4-.4-.4zm2.9-.5c-.5 0-1 .1-1.4.3-.3.1-.3.2-.3.4v9c0 .2.2.4.4.4h6.6c1.7 0 3.1-1.4 3.1-3.1s-1.4-3.1-3.1-3.1c-.4 0-.8.1-1.2.3-.3-2.4-2.3-4.2-4.8-4.2h.7z" />
      </svg>
    ),
  },
  {
    id: "suno",
    label: "Suno",
    field: "suno_url",
    hint: "De originele Suno-generatie",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 12v-1M8 12V7M12 12V4M16 12V8M20 12v-2M4 13v1M8 13v4M12 13v7M16 13v3M20 13v1" />
      </svg>
    ),
  },
  {
    id: "neuralanalog",
    label: "NeuralAnalog",
    field: "neuralanalog_url",
    hint: "Nabewerkt in NeuralAnalog",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19" />
      </svg>
    ),
  },
];

interface Props {
  urls: Partial<Record<TrackUrlField, string | null>>;
  onSave: (field: TrackUrlField, value: string | null) => void;
  /** compact = kleinere knoppen voor de versie-regels */
  compact?: boolean;
  label?: string;
}

const PlatformLinks = memo(function PlatformLinks({ urls, onSave, compact, label }: Props) {
  const [editing, setEditing] = useState<TrackUrlField | null>(null);
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const startEdit = (p: PlatformDef, current: string | null) => {
    setEditing(p.field);
    setDraft(current ?? "");
    setInvalid(false);
  };

  const commit = () => {
    if (!editing) return;
    const raw = draft.trim();
    if (raw && safeHttpUrl(raw) === null) { setInvalid(true); return; }
    onSave(editing, raw || null);
    setEditing(null);
  };

  return (
    <div className="mp-plat" data-compact={compact || undefined}>
      {label && <span className="mp-plat-label">{label}</span>}
      {PLATFORMS.map((p) => {
        const url = safeHttpUrl(urls[p.field] ?? null);
        const on = Boolean(url);
        return (
          <span key={p.id} className="mp-plat-slot">
            {on ? (
              <motion.a
                className="mp-plat-btn"
                data-platform={p.id}
                data-on="true"
                href={url as string}
                target="_blank"
                rel="noreferrer"
                title={`${p.hint} — opent in nieuw tabblad`}
                aria-label={`Open op ${p.label} (nieuw tabblad)`}
                whileTap={{ scale: 0.88 }}
                transition={{ type: "spring", stiffness: 700, damping: 22 }}
              >
                <span className="mp-plat-glow" aria-hidden="true" />
                <span className="mp-plat-icon">{p.icon}</span>
                <span className="mp-plat-name">{p.label}</span>
              </motion.a>
            ) : (
              <motion.button
                type="button"
                className="mp-plat-btn"
                data-platform={p.id}
                title={`${p.label} toevoegen`}
                aria-label={`${p.label}-link toevoegen`}
                onClick={() => startEdit(p, null)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 700, damping: 22 }}
              >
                <span className="mp-plat-icon">{p.icon}</span>
                <span className="mp-plat-name">{p.label}</span>
                <Plus size={11} className="mp-plat-plus" aria-hidden="true" />
              </motion.button>
            )}
            {on && (
              <button
                type="button"
                className="mp-plat-edit"
                onClick={() => startEdit(p, url)}
                aria-label={`${p.label}-link bewerken`}
                title="Link bewerken"
              >
                <span aria-hidden="true">✎</span>
              </button>
            )}
          </span>
        );
      })}

      {editing && (
        <motion.div
          className="mp-plat-edit-row"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
        >
          <input
            ref={inputRef}
            value={draft}
            aria-label={`${PLATFORMS.find((x) => x.field === editing)?.label}-link`}
            aria-invalid={invalid || undefined}
            data-invalid={invalid || undefined}
            onChange={(e) => { setDraft(e.target.value); setInvalid(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(null);
            }}
            placeholder="https://… (leeg = link verwijderen)"
          />
          <button type="button" className="mp-mini-btn" onClick={commit}>
            <Check size={13} aria-hidden="true" /> Opslaan
          </button>
          <button type="button" className="mp-mini-btn mp-mini-btn--ghost" onClick={() => setEditing(null)} aria-label="Annuleren">
            <X size={13} aria-hidden="true" />
          </button>
          {invalid && <span className="mp-plat-err">Alleen http(s)-links</span>}
        </motion.div>
      )}
    </div>
  );
});

export default PlatformLinks;
