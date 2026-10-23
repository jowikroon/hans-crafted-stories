import { describe, expect, it } from "vitest";
import { editSourceMap } from "./editSourceMap";

type TransformHook = (this: unknown, code: string, id: string) => { code: string } | null;
type GenerateBundleHook = (this: { emitFile: (f: { fileName: string; source: string }) => void }) => void;

const FIXTURE = [
  "export function Foo({ t }: { t: { heading: string } }) {",
  "  return (",
  "    <h1>",
  "      {t.heading} <em>Hello</em>",
  "    </h1>",
  "  );",
  "}",
  "",
].join("\n");

/** Run one module through a fresh plugin instance; return the transform result and the emitted source map. */
function run(root: string, id: string, code = FIXTURE) {
  const plugin = editSourceMap({ root });
  const out = (plugin.transform as unknown as TransformHook).call({}, code, id);
  const emitted: { fileName: string; source: string }[] = [];
  (plugin.generateBundle as unknown as GenerateBundleHook).call({ emitFile: (f) => emitted.push(f) });
  const asset = emitted.find((f) => f.fileName === "__edit/source-map.json");
  return { out, map: JSON.parse(asset!.source) };
}

describe("editSourceMap plugin", () => {
  it.each([
    ["Windows root, Vite-style id", "C:\\repo\\apps\\personal", "C:/repo/apps/personal/src/components/Foo.tsx"],
    ["Windows root, backslash id", "C:\\repo\\apps\\personal", "C:\\repo\\apps\\personal\\src\\components\\Foo.tsx"],
    ["POSIX root and id", "/repo/apps/personal", "/repo/apps/personal/src/components/Foo.tsx"],
    ["POSIX id with query", "/repo/apps/personal", "/repo/apps/personal/src/components/Foo.tsx?v=1a2b3c"],
  ])("tags elements: %s", (_label, root, id) => {
    const { out, map } = run(root, id);
    expect(out).not.toBeNull();
    expect(out!.code).toContain('<h1 data-src="components/Foo.tsx:3:5">');
    expect(out!.code).toContain('<em data-src="components/Foo.tsx:4:19">');
    expect(map.elements).toEqual({
      "components/Foo.tsx:3:5": [{ k: "jsx", l: 4, c: 18, v: " " }],
      "components/Foo.tsx:4:19": [{ k: "jsx", l: 4, c: 23, v: "Hello" }],
    });
  });

  it.each([
    ["Windows", "C:\\repo\\apps\\personal", "C:/repo/apps/personal/src/data/content.ts"],
    ["POSIX", "/repo/apps/personal", "/repo/apps/personal/src/data/content.ts"],
  ])("indexes data-file literals: %s", (_label, root, id) => {
    const { map } = run(root, id, 'export const x = { nl: "Hallo wereld", en: "Hello world" };\n');
    expect(map.literals["Hello world"]).toEqual([{ k: "str", f: "data/content.ts", l: 1, c: 44, v: "Hello world", g: "en" }]);
    expect(map.literals["Hallo wereld"]).toEqual([{ k: "str", f: "data/content.ts", l: 1, c: 24, v: "Hallo wereld", g: "nl" }]);
  });

  it.each([
    ["outside src/", "/repo/apps/personal", "/repo/apps/personal/scripts/Foo.tsx"],
    ["sibling dir sharing the src prefix", "/repo/apps/personal", "/repo/apps/personal/src-old/Foo.tsx"],
    ["node_modules", "C:\\repo\\apps\\personal", "C:/repo/apps/personal/src/node_modules/pkg/Foo.tsx"],
    ["excluded primitives", "C:\\repo\\apps\\personal", "C:/repo/apps/personal/src/components/ui/Foo.tsx"],
  ])("leaves %s untouched", (_label, root, id) => {
    const { out, map } = run(root, id);
    expect(out).toBeNull();
    expect(map.elements).toEqual({});
  });
});
