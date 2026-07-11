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
  /** Published posts for inline internal-link suggestions (design contract A8). */
  linkTargets?: { title: string; slug: string }[];
}

type AiAction = "tighten" | "translate" | null;

export default function RichEditor({ docKey, value, onChange, placeholder, bannedWords, lang, linkTargets = [] }: RichEditorProps) {
  const [aiBusy, setAiBusy] = useState<AiAction>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showTplPop, setShowTplPop] = useState(false);
  const [tplName, setTplName] = useState("");
  const [pqHint, setPqHint] = useState<string | null>(null);
  const [linkHint, setLinkHint] = useState<{ phrase: string; slug: string; title: string } | null>(null);
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

  // Pull-quote auto-suggest (design contract A7): debounced scan for strong claim sentences.
  useEffect(() => {
    if (!editor) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const CLAIM_RX = /\b(nooit|altijd|de meeste|in de praktijk|de echte|niemand|iedereen|het probleem is|de waarheid is|never|always|the real|actually)\b/i;
    const scan = () => {
      const text = editor.getText();
      const sentence = text.split(/(?<=[.!?])\s+/).find((s) => {
        const w = s.trim().split(/\s+/).length;
        return w >= 12 && w <= 40 && CLAIM_RX.test(s);
      });
      setPqHint(sentence ? sentence.trim() : null);
    };
    const onUpdate = () => { if (timer) clearTimeout(timer); timer = setTimeout(scan, 1200); };
    editor.on("update", onUpdate);
    scan();
    return () => { editor.off("update", onUpdate); if (timer) clearTimeout(timer); };
  }, [editor]);

  // Inline internal-link suggestion (design contract A8): find a published title mentioned in the draft.
  useEffect(() => {
    if (!editor || linkTargets.length === 0) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scan = () => {
      const text = editor.getText().toLowerCase();
      const hit = linkTargets.find((t) => {
        const key = t.title.toLowerCase().split(/[:|—-]/)[0].trim();
        return key.length > 8 && text.includes(key) && !text.includes(`/writing/${t.slug}`);
      });
      setLinkHint(hit ? { phrase: hit.title.split(/[:|—-]/)[0].trim(), slug: hit.slug, title: hit.title } : null);
    };
    const onUpdate = () => { if (timer) clearTimeout(timer); timer = setTimeout(scan, 1400); };
    editor.on("update", onUpdate);
    scan();
    return () => { editor.off("update", onUpdate); if (timer) clearTimeout(timer); };
  }, [editor, linkTargets]);

  const insertInternalLink = useCallback(() => {
    if (!editor || !linkHint) return;
    editor.chain().focus("end").insertContent(`<p><a href="/writing/${linkHint.slug}">${linkHint.title}</a></p>`).run();
    setLinkHint(null);
  }, [editor, linkHint]);

  const wrapPullQuote = useCallback(() => {
    if (!editor || !pqHint) return;
    // Append the strong sentence as a pull-quote blockquote (simple + robust).
    editor.chain().focus("end").insertContent(`<blockquote><p>${pqHint}</p></blockquote>`).run();
    setPqHint(null);
  }, [editor, pqHint]);

  const TPL_KEY = "hvl_write_templates_v1";
  const loadTpls = (): { name: string; html: string }[] => {
    try { return JSON.parse(localStorage.getItem(TPL_KEY) || "[]"); } catch { return []; }
  };
  const saveSelectionAsTpl = useCallback(() => {
    if (!editor || !tplName.trim()) return;
    const { from, to } = editor.state.selection;
    const slice = editor.state.doc.cut(from, to);
    const tmp = document.createElement("div");
    // serialize selection as text fallback (keeps it simple + robust)
    const txt = editor.state.doc.textBetween(from, to, "\n");
    tmp.textContent = txt;
    const tpls = loadTpls();
    tpls.unshift({ name: tplName.trim(), html: `<p>${tmp.innerHTML}</p>` });
    localStorage.setItem(TPL_KEY, JSON.stringify(tpls.slice(0, 12)));
    setTplName("");
    void slice;
  }, [editor, tplName]);
  const insertTpl = useCallback((html: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(html).run();
    setShowTplPop(false);
  }, [editor]);

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
          <Btn title="Tighten, AI rewrite, zelfde betekenis, minder woorden" disabled={aiBusy !== null} onClick={() => runAi("tighten")}>
            {aiBusy === "tighten" ? "…" : "Tighten"}
          </Btn>
          <Btn title={`Translate selection to ${lang === "en" ? "NL" : "EN"}`} disabled={aiBusy !== null} onClick={() => runAi("translate")}>
            {aiBusy === "translate" ? "…" : lang === "en" ? "→NL" : "→EN"}
          </Btn>
          <Btn title="Templates, selectie opslaan / invoegen" active={showTplPop} onClick={() => setShowTplPop((v) => !v)}>❖</Btn>
        </div>
      </BubbleMenu>

      {showTplPop && (
        <div className="tpl-pop">
          <div className="tpl-pop-row">
            <input className="tpl-pop-input" placeholder="Naam selectie…" value={tplName} onChange={(e) => setTplName(e.target.value)} />
            <button className="tpl-pop-save" onClick={saveSelectionAsTpl} disabled={!tplName.trim()}>+ Bewaar</button>
          </div>
          <div className="tpl-pop-list">
            {loadTpls().length === 0 ? (
              <div className="tpl-pop-empty">Nog geen templates, selecteer tekst en bewaar.</div>
            ) : loadTpls().map((t, i) => (
              <button key={i} className="tpl-pop-item" onClick={() => insertTpl(t.html)}>{t.name}</button>
            ))}
          </div>
        </div>
      )}
      <EditorContent editor={editor} />
      {pqHint && (
        <div className="pq-suggest">
          <span className="pq-glyph">✦</span> Pull-quote-kans gevonden
          <button className="pq-wrap" onClick={wrapPullQuote}>Wrap</button>
          <button className="pq-x" onClick={() => setPqHint(null)}>×</button>
        </div>
      )}
      {linkHint && (
        <div className="pq-suggest link-suggest">
          <span className="pq-glyph">🔗</span> Link-kans: <strong>{linkHint.phrase}</strong>
          <button className="pq-wrap" onClick={insertInternalLink}>Voeg link toe</button>
          <button className="pq-x" onClick={() => setLinkHint(null)}>×</button>
        </div>
      )}
      {aiError && (
        <div className="editor-ai-error">
          {aiError}
          <button onClick={() => setAiError(null)}>×</button>
        </div>
      )}
    </div>
  );
}
