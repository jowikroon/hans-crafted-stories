import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VoiceTemplate } from "../hooks/useVoiceTemplate";

interface Props {
  postId: string;
  activeTemplate: VoiceTemplate | null;
  assignedTemplateId: string | null;
  onChanged: () => void;
}

interface PopoverPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const SELECT = "id,name,category,tone,banned_words,content_rules,seo_guidelines,max_sentence_words,passive_voice_max_pct,avg_paragraph_sentences";

export default function VoiceTemplatePicker({ postId, activeTemplate, assignedTemplateId, onChanged }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<VoiceTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null);

  useEffect(() => {
    if (!open || templates.length > 0) return;
    setError(null);
    setLoading(true);
    supabase
      .from("hvl_voice_templates")
      .select(SELECT)
      .is("archived_at", null)
      .order("is_default", { ascending: false })
      .order("name")
      .then(({ data, error: loadError }) => {
        setLoading(false);
        if (loadError) {
          setError(loadError.message);
          return;
        }
        setTemplates((data ?? []) as VoiceTemplate[]);
      });
  }, [open, templates.length]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setPopoverPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 16;
      const gap = 8;
      const width = Math.min(340, window.innerWidth - viewportPadding * 2);
      const left = Math.min(
        Math.max(rect.left, viewportPadding),
        window.innerWidth - viewportPadding - width,
      );
      const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
      const spaceAbove = rect.top - gap - viewportPadding;
      const openAbove = spaceBelow < 160 && spaceAbove > spaceBelow;
      const maxHeight = Math.min(360, Math.max(120, openAbove ? spaceAbove : spaceBelow));
      const top = openAbove
        ? Math.max(viewportPadding, rect.top - gap - maxHeight)
        : rect.bottom + gap;

      setPopoverPosition({ top, left, width, maxHeight });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const choose = async (template: VoiceTemplate) => {
    if (template.id === assignedTemplateId) {
      setOpen(false);
      return;
    }
    setSavingId(template.id);
    setError(null);
    const { error: saveError } = await supabase
      .from("blog_posts")
      .update({
        voice_template_id: template.id,
        voice_match_score: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);
    setSavingId(null);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setOpen(false);
    onChanged();
  };

  return (
    <div className="voice-template-picker" ref={rootRef}>
      <button
        type="button"
        className={`voice-template-chip${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        title="Actieve voice-template wijzigen"
      >
        <span className="voice-template-chip__label">Voice</span>
        <strong>{activeTemplate?.name ?? "Kies template"}</strong>
        <span aria-hidden>⌄</span>
      </button>

      {open && popoverPosition && (
        <div
          className="voice-template-popover"
          role="listbox"
          aria-label="Voice-template kiezen"
          style={popoverPosition}
        >
          <div className="voice-template-popover__head">
            <span>Voice-template</span>
            <small>Direct actief voor tips en banned words</small>
          </div>
          {loading && <div className="voice-template-popover__state">Templates laden…</div>}
          {!loading && templates.length === 0 && !error && (
            <div className="voice-template-popover__state">Geen actieve templates gevonden.</div>
          )}
          {templates.map((template) => {
            const active = template.id === activeTemplate?.id;
            return (
              <button
                type="button"
                role="option"
                aria-selected={active}
                className={`voice-template-option${active ? " is-active" : ""}`}
                disabled={savingId !== null}
                key={template.id}
                onClick={() => choose(template)}
              >
                <span>
                  <strong>{template.name}</strong>
                  <small>{template.category} · {template.tone}</small>
                </span>
                <span>{savingId === template.id ? "…" : active ? "✓" : ""}</span>
              </button>
            );
          })}
          {error && <div className="voice-template-popover__error">{error}</div>}
        </div>
      )}
    </div>
  );
}
