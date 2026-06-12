// HeroImageSlot — Phase C full-bleed hero image surface.
//
// Bound to blog_posts.image_url. When empty, shows the Gemini-illustrated empty
// state (stamp shadow, repeating gradient backdrop, glyph, prompt to generate
// or paste a URL). When filled, shows the image with a small "Edit" chip overlay
// in the top-right corner. Edit prompts for a URL; the heavy generator wires to
// the existing useReviews.generateImage(postId) callback the parent passes in.
//
// All visuals come from .hero-image rules already in write-cms.css (Phase C
// appends a couple of helper classes for the input dialog state).

import { useState } from "react";

interface Props {
  imageUrl: string | null;
  onChangeUrl: (url: string) => void;
  onGenerate?: () => void;
  generating?: boolean;
  styleTag?: string;
}

const Sparkle = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M8 1l1.6 4.4 4.4 1.6-4.4 1.6L8 13l-1.6-4.4L2 7l4.4-1.6L8 1zm5 9l.7 1.8 1.8.7-1.8.7L13 15l-.7-1.8L10.5 12.5l1.8-.7L13 10z" />
  </svg>
);

export default function HeroImageSlot({ imageUrl, onChangeUrl, onGenerate, generating, styleTag }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(imageUrl ?? "");
  const empty = !imageUrl;

  const commit = () => {
    onChangeUrl(draft.trim());
    setEditing(false);
  };

  return (
    <div className={`hero-image${empty ? " empty" : ""}`} role={empty ? "button" : undefined} tabIndex={empty ? 0 : -1}>
      {empty ? (
        <div className="empty-cta">
          <div className="glyph"><Sparkle /></div>
          <strong>Add a hero image</strong>
          <span>generate · or paste a URL</span>
          <div className="hero-image-empty-actions">
            {onGenerate && (
              <button
                className="stamp-btn stamp-btn--sm"
                onClick={onGenerate}
                disabled={!!generating}
              >
                {generating ? "Generating…" : "Generate"}
              </button>
            )}
            <button
              className="stamp-btn stamp-btn--ghost stamp-btn--sm"
              onClick={() => { setDraft(""); setEditing(true); }}
            >
              Paste URL
            </button>
          </div>
        </div>
      ) : (
        <img src={imageUrl!} alt="" className="hero-image-img" />
      )}

      {!empty && (
        <button className="edit-chip" onClick={() => { setDraft(imageUrl!); setEditing(true); }}>
          ✎ Edit
        </button>
      )}
      {!empty && styleTag && <span className="style-tag">{styleTag}</span>}

      {editing && (
        <div className="hero-image-edit-overlay" role="dialog" aria-label="Edit hero image URL">
          <input
            type="url"
            className="hero-image-edit-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://…"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
          />
          <div className="hero-image-edit-actions">
            <button className="stamp-btn stamp-btn--sm" onClick={commit}>Save</button>
            <button className="stamp-btn stamp-btn--ghost stamp-btn--sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
