// BilingualEditor — Phase C TipTap rich editor with SPLIT/EN/NL lang tabs.
//
// Replaces the plain <textarea> pair in WriteMode. State machine:
//   lang = "split" | "en" | "nl"
//   - "split" renders both columns side by side
//   - "en" or "nl" renders the focused column full-width; the inactive column is hidden
//
// HTML is the source of truth. EN content -> blog_posts.content (HTML string).
// NL content -> blog_posts.content_nl. Autosave is owned by parent WriteMode via
// the existing usePostAutosave hook — we just call onContentChange("content", html)
// or onContentChange("content_nl", html) on every transaction.
//
// A floating BubbleMenu appears on text selection in either column with
// Bold / Italic / Underline / Link / Tighten / Translate actions.
// - Bold/Italic/Underline toggle TipTap marks.
// - Link prompts for a URL (Phase F replaces with an in-CMS picker).
// - Tighten replaces the selection with a shorter version via a callback (parent
//   wires to whatever transformer it prefers — default no-op + console hint).
// - Translate replaces selection by piping it through onTranslate(lang_from, lang_to, text).

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEffect, useState } from "react";

export type LangFocus = "split" | "en" | "nl";

interface Props {
  contentEn: string;
  contentNl: string;
  onContentChange: (key: "content" | "content_nl", html: string) => void;
  langFocus: LangFocus;
  /** Optional async sentence-tighten transformer. Receives raw selection text, returns replacement. */
  onTighten?: (text: string) => Promise<string> | string;
  /** Optional translate transformer. Receives ("en"|"nl", text), returns the other-language text. */
  onTranslate?: (from: "en" | "nl", text: string) => Promise<string> | string;
}

function makeEditor(opts: { initial: string; placeholder: string; onUpdate: (html: string) => void }) {
  // Helper kept inline so both EN and NL get the same extension set.
  return {
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: opts.placeholder, showOnlyWhenEditable: true, showOnlyCurrent: true }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener nofollow" } }),
      Underline,
    ],
    content: opts.initial || "",
    autofocus: false,
    onUpdate: ({ editor }: { editor: { getHTML: () => string } }) => opts.onUpdate(editor.getHTML()),
    editorProps: { attributes: { class: "prose" } },
  };
}

function Toolbar({
  lang,
  editor,
  onTighten,
  onTranslate,
}: {
  lang: "en" | "nl";
  editor: ReturnType<typeof useEditor> | null;
  onTighten?: Props["onTighten"];
  onTranslate?: Props["onTranslate"];
}) {
  if (!editor) return null;
  const promptLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  const tightenSelection = async () => {
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to, " ");
    if (!text.trim()) return;
    const next = onTighten ? await onTighten(text) : text.replace(/\s+/g, " ").trim();
    editor.chain().focus().insertContentAt({ from, to }, next).run();
  };
  const translateSelection = async () => {
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to, " ");
    if (!text.trim() || !onTranslate) return;
    const next = await onTranslate(lang, text);
    editor.chain().focus().insertContentAt({ from, to }, next).run();
  };
  // Selection-aware floating toolbar — visible only when there is a non-empty
  // selection in this editor. We track position from the editor view DOM so we
  // don't need the @tiptap/extension-bubble-menu / tippy.js plugin pair.
  return (
    <SelectionToolbar editor={editor}>
      <button
        className={editor.isActive("bold") ? "accent" : ""}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >B</button>
      <button
        className={editor.isActive("italic") ? "accent" : ""}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
        style={{ fontStyle: "italic" }}
      >I</button>
      <button
        className={editor.isActive("underline") ? "accent" : ""}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
        style={{ textDecoration: "underline" }}
      >U</button>
      <span className="sep" />
      <button
        className={editor.isActive("link") ? "accent" : ""}
        onClick={promptLink}
        title="Add or edit link"
      >Link</button>
      <span className="sep" />
      <button onClick={tightenSelection} title="Replace selection with a tighter version">Tighten</button>
      {onTranslate && (
        <button onClick={translateSelection} title={`Translate selection ${lang === "en" ? "EN → NL" : "NL → EN"}`}>Translate</button>
      )}
    </SelectionToolbar>
  );
}

/** Floating toolbar that follows the user's text selection inside a TipTap editor. */
function SelectionToolbar({ editor, children }: { editor: Editor; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const { from, to } = editor.state.selection;
      if (from === to || !editor.isFocused) { setPos(null); return; }
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      setPos({
        x: (start.left + end.right) / 2,
        y: Math.min(start.top, end.top),
      });
    };
    editor.on("selectionUpdate", update);
    editor.on("blur", () => setPos(null));
    editor.on("focus", update);
    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  if (!pos) return null;
  return (
    <div
      className="float-tools on"
      style={{ position: "fixed", left: pos.x, top: pos.y, transform: "translate(-50%, calc(-100% - 8px))" }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

export default function BilingualEditor({
  contentEn,
  contentNl,
  onContentChange,
  langFocus,
  onTighten,
  onTranslate,
}: Props) {
  const editorEn = useEditor(
    makeEditor({
      initial: contentEn,
      placeholder: "Start writing EN content…",
      onUpdate: (html) => onContentChange("content", html),
    }),
  );
  const editorNl = useEditor(
    makeEditor({
      initial: contentNl,
      placeholder: "Start writing NL content…",
      onUpdate: (html) => onContentChange("content_nl", html),
    }),
  );

  // Sync editor content if upstream value changes (e.g. autosave hydration after load).
  useEffect(() => {
    if (!editorEn) return;
    if (editorEn.getHTML() === contentEn) return;
    editorEn.commands.setContent(contentEn || "", { emitUpdate: false });
  }, [contentEn, editorEn]);

  useEffect(() => {
    if (!editorNl) return;
    if (editorNl.getHTML() === contentNl) return;
    editorNl.commands.setContent(contentNl || "", { emitUpdate: false });
  }, [contentNl, editorNl]);

  // Cleanup on unmount.
  useEffect(() => () => { editorEn?.destroy(); editorNl?.destroy(); }, [editorEn, editorNl]);

  const showEn = langFocus === "split" || langFocus === "en";
  const showNl = langFocus === "split" || langFocus === "nl";

  return (
    <div className="editor-body bilingual-editor" data-focus={langFocus}>
      {showEn && (
        <div className="lang-col lang-col--en">
          <div className="lang-col-tag">EN</div>
          <EditorContent editor={editorEn} />
          <Toolbar lang="en" editor={editorEn} onTighten={onTighten} onTranslate={onTranslate} />
        </div>
      )}
      {showEn && showNl && <div className="divider" aria-hidden />}
      {showNl && (
        <div className="lang-col lang-col--nl">
          <div className="lang-col-tag">NL</div>
          <EditorContent editor={editorNl} />
          <Toolbar lang="nl" editor={editorNl} onTighten={onTighten} onTranslate={onTranslate} />
        </div>
      )}
    </div>
  );
}
