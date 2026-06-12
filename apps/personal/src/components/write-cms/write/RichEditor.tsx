import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { supabase } from "@/integrations/supabase/client";
import { mdToHtml, htmlToMd } from "./markdown";
import { BannedWords } from "./bannedWords";

// ─── RichEditor — TipTap editor for the Write CMS ─────────────────────────────
// Markdown in, markdown out (storage format unchanged). Per the design contract:
// floating selection toolbar (Bold/Italic/H2/Quote/Link + Tighten + Translate)
// and live inline forbidden-word marks from the active voice template.

interface RichEditorProps {
  /** Stable key for the loaded document (post id + field). Editor content resets when this changes. */
  docKey: string;
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  bannedWords: string[];
  /** "en" | "nl" — used by the Translate action to pick the target language. */
  lang: "en" | "nl";
}

type AiAction = "tighten" | "translate" | null;

export default function RichEditor({ docKey, value, onChange, placeholder, bannedWords, lang }: RichEditorProps) {
  const [aiBusy, setAiBusy] = useState<AiAction>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const loadedKey = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Start writing..." }),
      BannedWords.configure({ words: bannedWords }),
    ],
    content: mdToHtml(value),
    editorProps: {
      attributes: { class: "write-editor write-editor--rich" },
    },
    onUpdate: ({ editor: e }) => {
      onChange(htmlToMd(e.getHTML()));
    },
  });

  // Sync external value into the editor: on document switch AND on async hydration
  // (usePostAutosave fills fields after first mount). Never while the user is typing.
  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) return;
    const incoming = (value ?? "").trim();
    const current = htmlToMd(editor.getHTML()).trim();
    if (loadedKey.current !== docKey || (incoming && incoming !== current)) {
      loadedKey.current = docKey;
      editor.commands.setContent(mdToHtml(value), { emitUpdate: false });
    }
  }, [editor, docKey, value]);

  // Refresh banned-word decorations when the voice template loads/changes
  useEffect(() => {
    if (editor) editor.commands.setBannedWords(bannedWords);
  }, [editor, bannedWords.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const runAi = useCallback(
    async (action: Exclude<AiAction, null>) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, "\n").trim();
      if (!text) return;
      setAiBusy(action);
      setAiError(null);
      try {
        const { data, error } = await supabase.functions.invoke("blog-youtube-analyze", {
          body: { action, text, target_lang: action === "translate" ? (lang === "en" ? "nl" : "en") : undefined },
        });
        if (error) throw new Error(error.message);
        const result = String((data as Record<string, unknown>)?.result ?? "");
        if (!result) throw new Error((data as Record<string, unknown>)?.error ? String((data as Record<string, unknown>).error) : "Empty AI response");
        editor.chain().focus().insertContentAt({ from, to }, result).run();
      } catch (err) {
        setAiError(err instanceof Error ? err.message : "AI action failed");
      } finally {
        setAiBusy(null);
      }
    },
    [editor, lang],
  );

  if (!editor) return null;

  const Btn = ({ onClick, active, title, children, disabled }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean }) => (
    <button
      type="button"
      className={`bubble-btn${active ? " is-active" : ""}`}
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );

  return (
    <div className="rich-editor-wrap">
      <BubbleMenu editor={editor} options={{ placement: "top" }}>
        <div className="bubble-menu">
          <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></Btn>
          <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></Btn>
          <Btn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Btn>
          <Btn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Btn>
          <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>&ldquo;&rdquo;</Btn>
          <Btn
            title="Link"
            active={editor.isActive("link")}
            onClick={() => {
              const prev = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt("URL", prev || "https://");
              if (url === null) return;
              if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
              else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }}
          >
            ↗
          </Btn>
          <span className="bubble-sep" />
          <Btn title="Tighten — AI rewrite, zelfde betekenis, minder woorden" disabled={aiBusy !== null} onClick={() => runAi("tighten")}>
            {aiBusy === "tighten" ? "…" : "Tighten"}
          </Btn>
          <Btn title={`Translate selection to ${lang === "en" ? "NL" : "EN"}`} disabled={aiBusy !== null} onClick={() => runAi("translate")}>
            {aiBusy === "translate" ? "…" : lang === "en" ? "→NL" : "→EN"}
          </Btn>
        </div>
      </BubbleMenu>
      <EditorContent editor={editor} />
      {aiError && (
        <div className="editor-ai-error">
          {aiError}
          <button onClick={() => setAiError(null)}>×</button>
        </div>
      )}
    </div>
  );
}
