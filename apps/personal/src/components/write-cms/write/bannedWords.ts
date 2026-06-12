import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";

// ─── Inline forbidden-word decorations ────────────────────────────────────────
// Marks every banned-word occurrence with <span class="forbidden"> while typing.
// The word list lives in extension options and can be refreshed via
// editor.commands.setBannedWords([...]) when the voice template loads.

export interface BannedWordsOptions {
  words: string[];
}

const key = new PluginKey("bannedWords");

function buildDecorations(doc: PMNode, words: string[]): DecorationSet {
  if (!words.length) return DecorationSet.empty;
  const escaped = words
    .map((w) => w.trim())
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return DecorationSet.empty;
  const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");

  const decos: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(node.text)) !== null) {
      decos.push(
        Decoration.inline(pos + m.index, pos + m.index + m[0].length, {
          class: "forbidden",
          title: "Banned word for this voice template",
        }),
      );
    }
  });
  return DecorationSet.create(doc, decos);
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    bannedWords: {
      /** Replace the banned-word list and re-decorate. */
      setBannedWords: (words: string[]) => ReturnType;
    };
  }
}

export const BannedWords = Extension.create<BannedWordsOptions>({
  name: "bannedWords",

  addOptions() {
    return { words: [] };
  },

  addCommands() {
    return {
      setBannedWords:
        (words: string[]) =>
        ({ tr, dispatch }) => {
          if (dispatch) dispatch(tr.setMeta(key, { words }));
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const initialWords = this.options.words;
    return [
      new Plugin({
        key,
        state: {
          init: (_config, state) => ({
            words: initialWords,
            decos: buildDecorations(state.doc, initialWords),
          }),
          apply: (tr, prev, _old, newState) => {
            const meta = tr.getMeta(key) as { words: string[] } | undefined;
            const words = meta?.words ?? prev.words;
            if (meta || tr.docChanged) {
              return { words, decos: buildDecorations(newState.doc, words) };
            }
            return prev;
          },
        },
        props: {
          decorations(state) {
            return (key.getState(state) as { decos: DecorationSet } | undefined)?.decos ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
