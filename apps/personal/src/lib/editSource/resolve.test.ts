import { resolveTextEdit, collectSegments, fullText, applyTextPreservingMarkup } from "./resolve";
import type { EditSourceMap } from "./codec";

const OLD_RAW = "Hans van Leeuwen — E-commerce &amp; Marketplace Manager (Amazon &amp; Bol.com): ";
const OLD_V = "Hans van Leeuwen — E-commerce & Marketplace Manager (Amazon & Bol.com): ";

const map: EditSourceMap = {
  v: 1,
  sha: null,
  elements: {
    "components/Hero.tsx:57:11": [
      { k: "jsx", l: 59, c: 19, raw: OLD_RAW, v: OLD_V },
      { k: "jsx", l: 59, c: 125, raw: ", groei &amp; AI-operations", v: ", groei & AI-operations" },
      { k: "jsx", l: 60, c: 19, raw: OLD_RAW, v: OLD_V },
      { k: "jsx", l: 60, c: 170, raw: ", growth &amp; AI operations", v: ", growth & AI operations" },
    ],
    "components/Hero.tsx:59:82": [{ k: "jsx", l: 59, c: 111, raw: "strategie", v: "strategie" }],
    "components/Hero.tsx:60:82": [{ k: "str", l: 60, c: 110, raw: '"hero_heading_emphasis"', v: "hero_heading_emphasis" }],
    "components/Hero.tsx:69:11": [{ k: "str", l: 70, c: 23, raw: '"hero_description"', v: "hero_description" }],
  },
  literals: {
    "Grow revenue on Amazon & Bol.com.": [{ k: "str", f: "data/translations.ts", l: 321, c: 20, raw: '"Grow revenue on Amazon & Bol.com."', v: "Grow revenue on Amazon & Bol.com.", g: "en" }],
    "Amazon NL specialist": [
      { k: "str", f: "data/translations.ts", l: 100, c: 5, raw: '"Amazon NL specialist"', v: "Amazon NL specialist", g: "nl" },
      { k: "str", f: "data/translations.ts", l: 300, c: 5, raw: '"Amazon NL specialist"', v: "Amazon NL specialist", g: "en" },
    ],
  },
};

function h1(lang: "en" | "nl") {
  const div = document.createElement("div");
  div.innerHTML =
    lang === "en"
      ? `<h1 data-src="components/Hero.tsx:57:11">${OLD_RAW}<em data-src="components/Hero.tsx:60:82">strategy</em>, growth &amp; AI operations</h1>`
      : `<h1 data-src="components/Hero.tsx:57:11">${OLD_RAW}<em data-src="components/Hero.tsx:59:82">strategie</em>, groei &amp; AI-operations</h1>`;
  document.body.appendChild(div);
  return div.querySelector("h1")!;
}

const orig = (t: Text) => undefined as string | undefined;

describe("resolveTextEdit", () => {
  afterEach(() => (document.body.innerHTML = ""));

  it("maps the EN H1 edit to line 60 using the <em> evidence", () => {
    const el = h1("en");
    const segs = collectSegments(el, orig);
    const newFull = fullText(segs).replace("E-commerce & ", "");
    const r = resolveTextEdit({ el, segments: segs, newFull, map, lang: "en" });
    expect(r.status).toBe("resolved");
    if (r.status !== "resolved") return;
    expect(r.patch.file).toBe("apps/personal/src/components/Hero.tsx");
    expect(r.patch.line).toBe(60);
    expect(r.patch.find).toBe(OLD_RAW);
    expect(r.patch.replace).toBe("Hans van Leeuwen — Marketplace Manager (Amazon &amp; Bol.com): ");
  });

  it("maps the NL H1 edit to line 59", () => {
    const el = h1("nl");
    const segs = collectSegments(el, orig);
    const r = resolveTextEdit({ el, segments: segs, newFull: fullText(segs).replace("E-commerce & ", ""), map, lang: "nl" });
    expect(r.status).toBe("resolved");
    if (r.status === "resolved") expect(r.patch.line).toBe(59);
  });

  it("resolves an edit inside the nested <em>", () => {
    const el = h1("nl");
    const segs = collectSegments(el, orig);
    const r = resolveTextEdit({ el, segments: segs, newFull: fullText(segs).replace("strategie", "strategisch"), map, lang: "nl" });
    expect(r.status).toBe("resolved");
    if (r.status === "resolved") {
      expect(r.patch.line).toBe(59);
      expect(r.patch.find).toBe("strategie");
      expect(r.patch.replace).toBe("strategisch");
    }
  });

  it("falls back to the literal index for text coming from translations", () => {
    document.body.innerHTML = `<p data-src="components/Hero.tsx:69:11">Grow revenue on Amazon &amp; Bol.com.</p>`;
    const el = document.querySelector("p")!;
    const segs = collectSegments(el, orig);
    const r = resolveTextEdit({ el, segments: segs, newFull: "Grow marketplace revenue on Amazon & Bol.com.", map, lang: "en" });
    expect(r.status).toBe("resolved");
    if (r.status === "resolved") {
      expect(r.patch.file).toBe("apps/personal/src/data/translations.ts");
      expect(r.patch.replace).toBe('"Grow marketplace revenue on Amazon & Bol.com."');
    }
  });

  it("uses the language hint to pick between identical literals", () => {
    document.body.innerHTML = `<a data-src="components/Hero.tsx:99:1">Amazon NL specialist</a>`;
    const el = document.querySelector("a")!;
    const segs = collectSegments(el, orig);
    const r = resolveTextEdit({ el, segments: segs, newFull: "Amazon NL expert", map, lang: "nl" });
    expect(r.status).toBe("resolved");
    if (r.status === "resolved") expect(r.patch.line).toBe(100);
  });

  it("refuses edits that span two text parts", () => {
    const el = h1("en");
    const segs = collectSegments(el, orig);
    const r = resolveTextEdit({ el, segments: segs, newFull: fullText(segs).replace("Bol.com): strategy", "Bol.com) Strategy"), map, lang: "en" });
    expect(r.status).toBe("unresolved");
  });

  it("reports noop for unchanged text", () => {
    const el = h1("en");
    const segs = collectSegments(el, orig);
    expect(resolveTextEdit({ el, segments: segs, newFull: fullText(segs), map, lang: "en" }).status).toBe("noop");
  });

  it("uses the override-free original text when an override is active", () => {
    const el = h1("en");
    const first = el.firstChild as Text;
    const original = first.data;
    first.data = "Hans van Leeuwen — Something else (Amazon & Bol.com): "; // runtime override applied
    const segs = collectSegments(el, (t) => (t === first ? original : undefined));
    const r = resolveTextEdit({ el, segments: segs, newFull: fullText(segs).replace("E-commerce & ", ""), map, lang: "en" });
    expect(r.status).toBe("resolved");
  });
});

describe("applyTextPreservingMarkup", () => {
  it("keeps inline elements intact", () => {
    document.body.innerHTML = `<h1>Hello big <em>world</em>, again</h1>`;
    const el = document.querySelector("h1")!;
    applyTextPreservingMarkup(el, "Hello small world, again");
    expect(el.innerHTML).toBe("Hello small <em>world</em>, again");
  });
});
