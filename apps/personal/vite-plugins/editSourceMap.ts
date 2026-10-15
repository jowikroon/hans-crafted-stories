/**
 * Vite plugin: source tags for the on-page edit overlay.
 *
 * 1. Every JSX element that directly renders literal text gets
 *    data-src="<file>:<line>:<col>" (file relative to src/). Applied in the
 *    client AND the SSR build, so prerendered HTML and hydration match.
 * 2. The client build emits /__edit/source-map.json: per data-src the literal
 *    text parts (raw source + rendered value), plus an index of string
 *    literals in data files (translations, content, service pages). The
 *    overlay uses it to turn "old text → new text" into an exact source patch.
 * 3. The client build emits /build.json ({ sha }) so the write-back worker can
 *    verify that a merged edit is actually live before it retires the
 *    runtime override.
 *
 * Only text is mapped; no DOM structure changes, no visual change.
 */
import ts from "typescript";
import path from "node:path";
import type { Plugin } from "vite";
import { decodeJsxText, type EditSourceMap, type SourcePart } from "../src/lib/editSource/codec";

interface Options {
  /** absolute path of apps/personal */
  root: string;
}

/** Files (relative to src/) that never get tags: primitives, the overlay itself, admin tools. */
const EXCLUDE: RegExp[] = [
  /^components\/(ui|edit-overlay|admin|command-center|dashboard|empire|hansai|music-cms|overlays|portal|wiki|write-cms)\//,
  /^features\/(blog-cms|samantha)\//,
  /^pages\/(BlogCMS|CommandV3|Dashboards\w*|Empire|GodStructure|HansAI|MusicCMS|Portal|SamanthaAI|Wiki|WriteCMS|AuthCallback|Bijlagen)\.tsx$/,
  /^pages\/dashboards\//,
  /^integrations\//,
  /\.(test|spec|stories)\.tsx?$/,
  /^test\//,
];

/** Plain .ts modules whose string literals are indexed as rendered-text sources. */
const DATA_FILES = /^(data|lib\/i18n)\/[^/]+\.ts$/;

/** Components that must not receive extra props. */
const NO_PROP_COMPONENTS = new Set([
  "Fragment", "Suspense", "StrictMode", "Helmet", "Route", "Routes", "Navigate", "Outlet",
  "AnimatePresence", "LayoutGroup", "MotionConfig", "Trans",
]);
const NO_TAG_INTRINSICS = new Set([
  "script", "style", "title", "meta", "link", "head", "html", "body", "noscript", "template", "textarea", "option",
]);

function isTaggable(tag: ts.JsxTagNameExpression): boolean {
  if (ts.isIdentifier(tag)) {
    const name = tag.text;
    if (/^[a-z]/.test(name)) return !NO_TAG_INTRINSICS.has(name);
    if (NO_PROP_COMPONENTS.has(name) || name.endsWith("Provider")) return false;
    return true;
  }
  if (ts.isPropertyAccessExpression(tag)) {
    const last = tag.name.text;
    if (last === "Fragment" || last.endsWith("Provider")) return false;
    return true; // motion.p, Tabs.Trigger, ...
  }
  return false; // this, namespaced names
}

function hasDataSrc(attrs: ts.JsxAttributes): boolean {
  return attrs.properties.some((p) => ts.isJsxAttribute(p) && ts.isIdentifier(p.name) && p.name.text === "data-src");
}

function lineCol(sf: ts.SourceFile, pos: number): { l: number; c: number } {
  const lc = sf.getLineAndCharacterOfPosition(pos);
  return { l: lc.line + 1, c: lc.character + 1 };
}

/**
 * Forward slashes on every platform. Vite ids on Windows are "C:/..." while
 * node:path yields "C:\...", so both sides are normalised before comparing.
 */
const toPosix = (p: string) => p.replace(/\\/g, "/");

function isJsxElementLike(n: ts.Node): boolean {
  return ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n);
}

/** Collect literal text rendered directly by an element (stops at nested elements). */
function collectChildren(children: ts.NodeArray<ts.JsxChild>, sf: ts.SourceFile, code: string, out: SourcePart[]) {
  for (const ch of children) {
    if (ts.isJsxText(ch)) {
      if (ch.containsOnlyTriviaWhiteSpaces) continue;
      const raw = code.slice(ch.pos, ch.end);
      const v = decodeJsxText(raw).value;
      if (!v) continue;
      out.push({ k: "jsx", ...lineCol(sf, ch.pos), raw, v });
    } else if (ts.isJsxExpression(ch)) {
      if (ch.expression) collectExpr(ch.expression, sf, code, out);
    } else if (ts.isJsxFragment(ch)) {
      collectChildren(ch.children, sf, code, out);
    }
    // nested elements own their text (they get their own data-src)
  }
}

function collectExpr(node: ts.Node, sf: ts.SourceFile, code: string, out: SourcePart[]) {
  if (isJsxElementLike(node)) return;
  if (ts.isJsxFragment(node)) {
    collectChildren(node.children, sf, code, out);
    return;
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const start = node.getStart(sf);
    const raw = code.slice(start, node.end);
    if (node.text) out.push({ k: ts.isStringLiteral(node) ? "str" : "tpl", ...lineCol(sf, start), raw, v: node.text });
    return;
  }
  if (ts.isTypeNode(node)) return;
  ts.forEachChild(node, (c) => collectExpr(c, sf, code, out));
}

/** nl/en hint: nearest enclosing object key named "nl" or "en". */
function langHint(node: ts.Node): string | undefined {
  for (let p: ts.Node | undefined = node.parent; p; p = p.parent) {
    if (ts.isPropertyAssignment(p)) {
      const n = p.name;
      const key = ts.isIdentifier(n) || ts.isStringLiteral(n) ? n.text : "";
      if (key === "nl" || key === "en") return key;
    }
  }
  return undefined;
}

function isIndexableLiteral(node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral): boolean {
  const p = node.parent;
  if (!p) return false;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p)) return false;
  if (ts.isLiteralTypeNode(p)) return false;
  if ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p) || ts.isMethodDeclaration(p)) && p.name === node) return false;
  if (ts.isJsxAttribute(p)) return false;
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return false;
  if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && ["cn", "clsx", "cva", "twMerge", "require"].includes(p.expression.text)) return false;
  const v = node.text;
  if (v.length < 2 || v.length > 1200) return false; // overlay text edits are capped well below this
  if (!/\p{L}{2}/u.test(v)) return false; // no words
  if (/^(https?:|mailto:|tel:|\/|#|\.\/)/.test(v)) return false; // urls, paths, anchors
  if (/\n/.test(v) && /[{};<>]/.test(v)) return false; // embedded code / css / html
  return true;
}

function indexLiterals(code: string, file: string, rel: string, literals: EditSourceMap["literals"], kind: ts.ScriptKind) {
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, kind);
  // drop stale entries of this file (dev/HMR re-transforms)
  for (const v of Object.keys(literals)) {
    const kept = literals[v].filter((p) => p.f !== rel);
    if (kept.length) literals[v] = kept;
    else delete literals[v];
  }
  const visit = (node: ts.Node) => {
    if (kind === ts.ScriptKind.TSX && (isJsxElementLike(node) || ts.isJsxFragment(node))) return; // JSX text is mapped per element
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && isIndexableLiteral(node)) {
      const start = node.getStart(sf);
      const part: SourcePart = { k: ts.isStringLiteral(node) ? "str" : "tpl", f: rel, ...lineCol(sf, start), raw: code.slice(start, node.end), v: node.text };
      const g = langHint(node);
      if (g) part.g = g;
      (literals[node.text] ??= []).push(part);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

function tagTsx(code: string, file: string, rel: string, elements: EditSourceMap["elements"]): string | null {
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  for (const k of Object.keys(elements)) if (k.startsWith(rel + ":")) delete elements[k];
  const inserts: { pos: number; text: string }[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node)) {
      const open = node.openingElement;
      if (!open.typeArguments && isTaggable(open.tagName) && !hasDataSrc(open.attributes)) {
        const parts: SourcePart[] = [];
        collectChildren(node.children, sf, code, parts);
        if (parts.length) {
          const { l, c } = lineCol(sf, open.getStart(sf));
          const key = `${rel}:${l}:${c}`;
          elements[key] = parts;
          inserts.push({ pos: open.tagName.getEnd(), text: ` data-src="${key}"` });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!inserts.length) return null;
  inserts.sort((a, b) => b.pos - a.pos);
  let out = code;
  for (const ins of inserts) out = out.slice(0, ins.pos) + ins.text + out.slice(ins.pos);
  return out;
}

export function editSourceMap(opts: Options): Plugin {
  const srcRoot = path.posix.join(toPosix(opts.root), "src");
  const elements: EditSourceMap["elements"] = {};
  const literals: EditSourceMap["literals"] = {};
  let isSsr = false;

  const snapshot = (): EditSourceMap => ({ v: 1, sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null, elements, literals });

  /** Wire format: drop `raw` when it is derivable (see expandPart in codec.ts). */
  const compact = (map: EditSourceMap) => {
    const slim = (p: SourcePart) => {
      const { raw, ...rest } = p;
      const derivable = p.k === "jsx" ? raw === p.v : p.k === "str" ? raw === JSON.stringify(p.v) : false;
      return derivable ? rest : { ...rest, raw };
    };
    const el: Record<string, unknown[]> = {};
    for (const [k, ps] of Object.entries(map.elements)) el[k] = ps.map(slim);
    const li: Record<string, unknown[]> = {};
    for (const [k, ps] of Object.entries(map.literals)) li[k] = ps.map(slim);
    return { v: map.v, sha: map.sha, elements: el, literals: li };
  };

  return {
    name: "hvl-edit-source-map",
    enforce: "pre",
    configResolved(config) {
      isSsr = !!config.build.ssr;
    },
    configureServer(server) {
      server.middlewares.use("/__edit/source-map.json", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(compact(snapshot())));
      });
    },
    transform(code, id) {
      const file = toPosix(id.split("?")[0]);
      if (file.includes("/node_modules/") || !file.startsWith(srcRoot + "/")) return null;
      const rel = file.slice(srcRoot.length + 1);
      if (EXCLUDE.some((re) => re.test(rel))) return null;
      if (file.endsWith(".tsx")) {
        indexLiterals(code, file, rel, literals, ts.ScriptKind.TSX);
        if (!code.includes("<")) return null;
        const out = tagTsx(code, file, rel, elements);
        return out == null ? null : { code: out, map: null };
      }
      if (file.endsWith(".ts") && DATA_FILES.test(rel)) indexLiterals(code, file, rel, literals, ts.ScriptKind.TS);
      return null;
    },
    generateBundle() {
      if (isSsr) return;
      const map = snapshot();
      this.emitFile({ type: "asset", fileName: "__edit/source-map.json", source: JSON.stringify(compact(map)) });
      this.emitFile({
        type: "asset",
        fileName: "build.json",
        source: JSON.stringify({
          sha: map.sha,
          ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
          env: process.env.VERCEL_ENV ?? null,
          built_at: new Date().toISOString(),
        }),
      });
    },
  };
}
