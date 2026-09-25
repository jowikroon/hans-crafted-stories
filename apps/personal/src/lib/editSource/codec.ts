/**
 * Edit-overlay source codec — pure helpers (no DOM, no React) shared by the
 * Vite build plugin (vite-plugins/editSourceMap.ts) and the in-browser
 * overlay (src/lib/editSource/resolve.ts).
 *
 * A "part" is one piece of literal text in a .tsx/.ts source file that ends up
 * as one DOM text node: a JSX text run, a string literal or a template literal
 * without substitutions. For every part we know the raw source slice (`raw`)
 * and the value React renders (`v`). To write an edit back to the source we
 * need both directions:
 *   raw  -> value  (decode, with an index map value-offset -> raw-offset)
 *   value -> raw   (encode the inserted text in the part's own syntax)
 * Every patch is verified by decoding the patched raw slice again; a patch
 * whose decoded value differs from the intended value is never produced.
 */

export type PartKind = "jsx" | "str" | "tpl";

export interface SourcePart {
  /** kind of literal */
  k: PartKind;
  /** 1-based line of the part start */
  l: number;
  /** 1-based column of the part start */
  c: number;
  /** raw source slice, exactly as in the file (quotes included for str/tpl) */
  raw: string;
  /** rendered value */
  v: string;
  /** file (relative to apps/personal/src) — only set in the literals index */
  f?: string;
  /** language hint ("nl" | "en") when the literal sits under an nl/en key */
  g?: string;
}

export interface EditSourceMap {
  v: 1;
  /** commit the build was made from (VERCEL_GIT_COMMIT_SHA), if known */
  sha: string | null;
  /** data-src key ("components/Hero.tsx:57:11") -> text parts owned by that element */
  elements: Record<string, SourcePart[]>;
  /** rendered value -> literal occurrences in data files (translations, content, ...) */
  literals: Record<string, SourcePart[]>;
}

/** Parts as served in /__edit/source-map.json: `raw` omitted when derivable. */
export type WirePart = Omit<SourcePart, "raw"> & { raw?: string };
export interface WireSourceMap {
  v: 1;
  sha: string | null;
  elements: Record<string, WirePart[]>;
  literals: Record<string, WirePart[]>;
}

export function expandPart(p: WirePart): SourcePart | null {
  if (p.raw != null) return p as SourcePart;
  if (p.k === "jsx") return { ...p, raw: p.v };
  if (p.k === "str") return { ...p, raw: JSON.stringify(p.v) };
  return null;
}

export function expandSourceMap(w: WireSourceMap): EditSourceMap {
  const conv = (rec: Record<string, WirePart[]>) => {
    const out: Record<string, SourcePart[]> = {};
    for (const [k, ps] of Object.entries(rec || {})) {
      const full = ps.map(expandPart).filter((x): x is SourcePart => !!x);
      if (full.length) out[k] = full;
    }
    return out;
  };
  return { v: 1, sha: w.sha ?? null, elements: conv(w.elements), literals: conv(w.literals) };
}

// ── HTML entities (the subset JSX authors actually use; unknown → left as-is) ──
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", middot: "·", bull: "•",
  rarr: "→", larr: "←", uarr: "↑", darr: "↓", harr: "↔",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»",
  copy: "©", reg: "®", trade: "™", euro: "€", deg: "°", times: "×",
  shy: "­", zwj: "‍", zwnj: "‌", thinsp: " ", ensp: " ", emsp: " ",
};

interface Decoded {
  value: string;
  /** map[i] = raw offset where decoded char i starts; map[value.length] = raw end */
  map: number[];
}

/** Decode one entity at raw[i] ("&...;"). Returns [char, rawLength] or null. */
function decodeEntityAt(raw: string, i: number): [string, number] | null {
  const m = /^&(#x[0-9a-fA-F]{1,6}|#[0-9]{1,7}|[A-Za-z][A-Za-z0-9]{1,31});/.exec(raw.slice(i, i + 40));
  if (!m) return null;
  const body = m[1];
  let ch: string | undefined;
  if (body[0] === "#") {
    const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
    if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) ch = String.fromCodePoint(code);
  } else {
    ch = NAMED_ENTITIES[body];
  }
  return ch === undefined ? null : [ch, m[0].length];
}

/**
 * JSX text → rendered value, following Babel/TypeScript's
 * `cleanJSXElementLiteralChild`: lines are trimmed (except the outer edges of
 * the first/last line), whitespace-only lines vanish, remaining lines are
 * joined with one space, tabs count as spaces; then entities are decoded.
 */
export function decodeJsxText(raw: string): Decoded {
  // 1) split into lines while remembering raw offsets
  const lines: { text: string; start: number }[] = [];
  const re = /\r\n|\n|\r/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    lines.push({ text: raw.slice(last, m.index), start: last });
    last = m.index + m[0].length;
  }
  lines.push({ text: raw.slice(last), start: last });

  // 0, not -1 (as in Babel): a whitespace-only single-line run such as the
  // " " in `{a} <em>b</em>` must not get a joining space appended.
  let lastNonEmpty = 0;
  lines.forEach((ln, idx) => {
    if (/[^ \t]/.test(ln.text)) lastNonEmpty = idx;
  });

  // 2) collect kept characters with raw offsets (still entity-encoded)
  const chars: string[] = [];
  const offs: number[] = [];
  lines.forEach((ln, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === lines.length - 1;
    let s = 0;
    let e = ln.text.length;
    if (!isFirst) while (s < e && (ln.text[s] === " " || ln.text[s] === "\t")) s++;
    if (!isLast) while (e > s && (ln.text[e - 1] === " " || ln.text[e - 1] === "\t")) e--;
    if (e <= s) return;
    for (let k = s; k < e; k++) {
      chars.push(ln.text[k] === "\t" ? " " : ln.text[k]);
      offs.push(ln.start + k);
    }
    if (idx !== lastNonEmpty) {
      // the joining space maps onto the line break that follows this line
      chars.push(" ");
      offs.push(ln.start + e);
    }
  });

  // 3) decode entities over the kept characters
  let value = "";
  const map: number[] = [];
  const joined = chars.join("");
  for (let i = 0; i < joined.length; ) {
    if (joined[i] === "&") {
      const ent = decodeEntityAt(joined, i);
      if (ent) {
        // entities never span a line break in practice; map to the '&'
        for (let u = 0; u < ent[0].length; u++) map.push(offs[i]);
        value += ent[0];
        i += ent[1];
        continue;
      }
    }
    value += joined[i];
    map.push(offs[i]);
    i++;
  }
  // end offset: right after the last kept raw char (the final kept char is
  // never a joining space, so this also covers a trailing entity like "&amp;")
  map.push(offs.length ? offs[offs.length - 1] + 1 : raw.length);
  return { value, map };
}

/** Escape text for insertion into a JSX text run. */
export function encodeJsxText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
    .replace(/\r\n|\n|\r/g, " ");
}

/** Decode a JS string literal or no-substitution template literal (quotes included). */
export function decodeJsString(raw: string): Decoded | null {
  if (raw.length < 2) return null;
  const q = raw[0];
  if ((q !== '"' && q !== "'" && q !== "`") || raw[raw.length - 1] !== q) return null;
  let value = "";
  const map: number[] = [];
  const end = raw.length - 1;
  for (let i = 1; i < end; ) {
    const ch = raw[i];
    if (q === "`" && ch === "$" && raw[i + 1] === "{") return null; // has substitutions
    if (ch !== "\\") {
      value += ch;
      map.push(i);
      i++;
      continue;
    }
    const n = raw[i + 1];
    const simple: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", "0": "\0" };
    if (n in simple && !(n === "0" && /[0-9]/.test(raw[i + 2] ?? ""))) {
      value += simple[n];
      map.push(i);
      i += 2;
    } else if (n === "x") {
      const hex = raw.slice(i + 2, i + 4);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) return null;
      value += String.fromCharCode(parseInt(hex, 16));
      map.push(i);
      i += 4;
    } else if (n === "u") {
      let code: number;
      let len: number;
      if (raw[i + 2] === "{") {
        const close = raw.indexOf("}", i + 3);
        if (close < 0) return null;
        code = parseInt(raw.slice(i + 3, close), 16);
        len = close + 1 - i;
      } else {
        const hex = raw.slice(i + 2, i + 6);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) return null;
        code = parseInt(hex, 16);
        len = 6;
      }
      if (!Number.isFinite(code)) return null;
      const s = String.fromCodePoint(code);
      for (let u = 0; u < s.length; u++) map.push(i);
      value += s;
      i += len;
    } else if (n === "\r" || n === "\n" || n === " " || n === " ") {
      // line continuation: produces nothing
      i += n === "\r" && raw[i + 2] === "\n" ? 3 : 2;
    } else if (n === undefined) {
      return null;
    } else {
      value += n; // \" \' \\ \` and identity escapes
      map.push(i);
      i += 2;
    }
  }
  map.push(end);
  return { value, map };
}

/** Escape text for insertion into a string literal delimited by `quote`. */
export function encodeJsString(text: string, quote: string): string {
  let out = text.replace(/\\/g, "\\\\").replace(/\r/g, "\\r").replace(/\n/g, "\\n");
  if (quote === "`") out = out.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  else out = out.split(quote).join("\\" + quote);
  // (split/join instead of a regex literal: some toolchains emit U+2028 raw
  // inside regex literals, which then terminates the literal)
  return out.split(String.fromCharCode(0x2028)).join("\\u2028").split(String.fromCharCode(0x2029)).join("\\u2029");
}

export function decodePart(k: PartKind, raw: string): Decoded | null {
  return k === "jsx" ? decodeJsxText(raw) : decodeJsString(raw);
}

/**
 * Replace value range [a, b) of a part by `insert`, producing the new raw
 * slice. Returns null when the result does not decode to the expected value
 * (the caller then refuses to write back — never a guessed patch).
 */
export function patchPartRaw(part: Pick<SourcePart, "k" | "raw" | "v">, a: number, b: number, insert: string): string | null {
  const dec = decodePart(part.k, part.raw);
  if (!dec || dec.value !== part.v) return null;
  if (a < 0 || b < a || b > dec.value.length) return null;
  const rawA = dec.map[a];
  // end: raw offset right after decoded char b-1 (or rawA for an empty range)
  let rawB: number;
  if (b === a) rawB = rawA;
  else if (b === dec.value.length) rawB = dec.map[dec.value.length];
  else rawB = dec.map[b];
  if (rawA == null || rawB == null || rawB < rawA) return null;
  const enc = part.k === "jsx" ? encodeJsxText(insert) : encodeJsString(insert, part.raw[0]);
  const next = part.raw.slice(0, rawA) + enc + part.raw.slice(rawB);
  const expected = part.v.slice(0, a) + insert + part.v.slice(b);
  const check = decodePart(part.k, next);
  if (!check || check.value !== expected) return null;
  return next;
}

/** Longest common prefix / suffix split of two strings. */
export function diffRange(oldText: string, newText: string): { p: number; oldEnd: number; newEnd: number } {
  let p = 0;
  const max = Math.min(oldText.length, newText.length);
  while (p < max && oldText[p] === newText[p]) p++;
  let s = 0;
  while (
    s < oldText.length - p &&
    s < newText.length - p &&
    oldText[oldText.length - 1 - s] === newText[newText.length - 1 - s]
  ) s++;
  return { p, oldEnd: oldText.length - s, newEnd: newText.length - s };
}
