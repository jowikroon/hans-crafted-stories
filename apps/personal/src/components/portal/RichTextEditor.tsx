import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useCallback, useState, useRef } from "react";
import TurndownService from "turndown";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Minus, Link as LinkIcon,
  Image as ImageIcon, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, Undo2, Redo2,
  Eye, Pencil, Pilcrow, RemoveFormatting,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════
//  RichTextEditor — TipTap-based editor with toolbar
//  Accepts markdown string, outputs markdown string.
//  Used in BlogPostFormModal, CaseStudyFormModal, PageContentEditorModal.
// ═══════════════════════════════════════════════════════════

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  minHeight?: string;
  /** Show only a compact subset of toolbar buttons */
  compact?: boolean;
  /** Additional class on the wrapper */
  className?: string;
}

// ─── Markdown ↔ HTML conversion ──────────────────────────

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
  hr: "---",
});

// Preserve underline as markdown (non-standard, but round-trips through our editor)
turndown.addRule("underline", {
  filter: ["u"],
  replacement: (content) => `<u>${content}</u>`,
});

function markdownToHtml(md: string): string {
  if (!md) return "";
  return md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
      `<pre><code class="language-${lang || "plaintext"}">${code.replace(/</g, "&lt;")}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold / Italic / Strikethrough
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    // Blockquote
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Unordered list
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    // Ordered list
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // HR
    .replace(/^---$/gm, "<hr />")
    // Paragraphs (double newline)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");
}

function htmlToMarkdown(html: string): string {
  if (!html) return "";
  return turndown.turndown(html);
}

// ─── Toolbar button ──────────────────────────────────────

function Btn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
        active
          ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(var(--primary-rgb,99,102,241),0.2)]"
          : "text-muted-foreground/60 hover:bg-secondary/60 hover:text-foreground"
      } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="mx-0.5 h-4 w-px bg-border/60 shrink-0" />;
}

// ─── Link prompt ─────────────────────────────────────────

function useLinkPrompt(editor: ReturnType<typeof useEditor>) {
  return useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);
}

// ─── Image prompt ────────────────────────────────────────

function useImagePrompt(editor: ReturnType<typeof useEditor>) {
  return useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Image URL", "https://");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Start writing…",
  minHeight = "200px",
  compact = false,
  className = "",
}: RichTextEditorProps) => {
  const [mode, setMode] = useState<"write" | "markdown">("write");
  const [rawMarkdown, setRawMarkdown] = useState(value);
  const suppressUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: "rounded-md bg-secondary/60 border border-border p-3 font-mono text-xs" } },
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline cursor-pointer" } }),
      ImageExt.configure({ HTMLAttributes: { class: "rounded-md max-w-full my-2" } }),
      Placeholder.configure({ placeholder }),
      Typography,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: markdownToHtml(value),
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3",
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (suppressUpdate.current) return;
      const html = ed.getHTML();
      const md = htmlToMarkdown(html);
      setRawMarkdown(md);
      onChange(md);
    },
  });

  const setLink = useLinkPrompt(editor);
  const setImage = useImagePrompt(editor);

  // Sync external value changes into editor (e.g. AI suggestions, copy-from-english)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const currentMd = htmlToMarkdown(editor.getHTML());
    // Only update if the external value genuinely differs
    if (value !== currentMd) {
      suppressUpdate.current = true;
      editor.commands.setContent(markdownToHtml(value));
      setRawMarkdown(value);
      suppressUpdate.current = false;
    }
  }, [value, editor]);

  // Switch between WYSIWYG and raw markdown mode
  const switchMode = useCallback((newMode: "write" | "markdown") => {
    if (!editor || newMode === mode) return;
    if (newMode === "markdown") {
      setRawMarkdown(htmlToMarkdown(editor.getHTML()));
    } else {
      suppressUpdate.current = true;
      editor.commands.setContent(markdownToHtml(rawMarkdown));
      suppressUpdate.current = false;
      onChange(rawMarkdown);
    }
    setMode(newMode);
  }, [editor, mode, rawMarkdown, onChange]);

  const handleRawChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawMarkdown(e.target.value);
    onChange(e.target.value);
  }, [onChange]);

  if (!editor) return null;

  const sz = 13;

  return (
    <div className={`rounded-xl border border-border/60 bg-card/30 overflow-hidden transition-all focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/15 ${className}`}>
      {/* ─── Toolbar ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/50 bg-secondary/20 px-2 py-1.5">
        {/* Mode toggle */}
        <div className="flex rounded-md border border-border/50 bg-background/50 p-0.5 mr-1.5">
          <button
            type="button"
            onClick={() => switchMode("write")}
            className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
              mode === "write"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground/50 hover:text-muted-foreground"
            }`}
          >
            <Pencil size={10} /> Write
          </button>
          <button
            type="button"
            onClick={() => switchMode("markdown")}
            className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
              mode === "markdown"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground/50 hover:text-muted-foreground"
            }`}
          >
            <Code size={10} /> Markdown
          </button>
        </div>

        {mode === "write" && (
          <>
            {/* Undo / Redo */}
            <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (⌘Z)">
              <Undo2 size={sz} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (⌘⇧Z)">
              <Redo2 size={sz} />
            </Btn>

            <Sep />

            {/* Text formatting */}
            <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (⌘B)">
              <Bold size={sz} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (⌘I)">
              <Italic size={sz} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (⌘U)">
              <UnderlineIcon size={sz} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
              <Strikethrough size={sz} />
            </Btn>

            {!compact && (
              <>
                <Sep />

                {/* Headings */}
                <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
                  <Heading1 size={sz} />
                </Btn>
                <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
                  <Heading2 size={sz} />
                </Btn>
                <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
                  <Heading3 size={sz} />
                </Btn>
                <Btn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="Paragraph">
                  <Pilcrow size={sz} />
                </Btn>
              </>
            )}

            <Sep />

            {/* Lists */}
            <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
              <List size={sz} />
            </Btn>
            <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
              <ListOrdered size={sz} />
            </Btn>

            {!compact && (
              <>
                <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
                  <Quote size={sz} />
                </Btn>
                <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
                  <Code size={sz} />
                </Btn>
                <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
                  <Minus size={sz} />
                </Btn>

                <Sep />

                {/* Alignment */}
                <Btn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
                  <AlignLeft size={sz} />
                </Btn>
                <Btn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
                  <AlignCenter size={sz} />
                </Btn>
                <Btn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
                  <AlignRight size={sz} />
                </Btn>

                <Sep />

                {/* Insert */}
                <Btn onClick={setLink} active={editor.isActive("link")} title="Insert Link">
                  <LinkIcon size={sz} />
                </Btn>
                <Btn onClick={setImage} title="Insert Image">
                  <ImageIcon size={sz} />
                </Btn>
              </>
            )}

            {compact && (
              <>
                <Sep />
                <Btn onClick={setLink} active={editor.isActive("link")} title="Insert Link">
                  <LinkIcon size={sz} />
                </Btn>
              </>
            )}

            <div className="flex-1" />

            {/* Clear formatting */}
            <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting">
              <RemoveFormatting size={sz} />
            </Btn>
          </>
        )}
      </div>

      {/* ─── Editor area ───────────────────────────────── */}
      {mode === "write" ? (
        <div className="overflow-y-auto" style={{ maxHeight: "500px" }}>
          <EditorContent editor={editor} />
        </div>
      ) : (
        <textarea
          value={rawMarkdown}
          onChange={handleRawChange}
          className="w-full min-h-[200px] bg-transparent px-4 py-3 font-mono text-xs leading-relaxed text-foreground outline-none resize-y"
          style={{ minHeight }}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
