import { decodeJsxText, decodeJsString, encodeJsString, patchPartRaw, diffRange } from "./codec";

describe("editSource codec", () => {
  it("decodes JSX text with entities like React renders it", () => {
    const raw = "Hans van Leeuwen — E-commerce &amp; Marketplace Manager (Amazon &amp; Bol.com): ";
    expect(decodeJsxText(raw).value).toBe("Hans van Leeuwen — E-commerce & Marketplace Manager (Amazon & Bol.com): ");
  });

  it("collapses multi-line JSX text the way Babel/TS do", () => {
    const raw = "\n            Hello\n            big   world\n          ";
    expect(decodeJsxText(raw).value).toBe("Hello big   world");
    expect(decodeJsxText("  lead\n  tail  ").value).toBe("  lead tail  ");
    expect(decodeJsxText("\n   \n  ").value).toBe("");
  });

  it("keeps whitespace-only single-line runs as-is and drops multi-line ones", () => {
    // e.g. the " " between `{t.heading}` and `<em>` in a heading
    expect(decodeJsxText(" ").value).toBe(" ");
    expect(decodeJsxText("   ").value).toBe("   ");
    expect(decodeJsxText("\t").value).toBe(" ");
    expect(decodeJsxText(" ").map).toEqual([0, 1]);
    expect(decodeJsxText("\n   \n  ").value).toBe("");
    expect(decodeJsxText(" \n ").value).toBe("");
    expect(decodeJsxText("  \r\n\t\t").value).toBe("");
  });

  it("patches a whitespace-only JSX text run", () => {
    const out = patchPartRaw({ k: "jsx", raw: " ", v: " " }, 0, 1, " and ");
    expect(out).toBe(" and ");
    expect(patchPartRaw({ k: "jsx", raw: " ", v: " " }, 1, 1, "& more ")).toBe(" &amp; more ");
  });

  it("patches a JSX text run and keeps the source style", () => {
    const raw = "Hans van Leeuwen — E-commerce &amp; Marketplace Manager (Amazon &amp; Bol.com): ";
    const v = decodeJsxText(raw).value;
    const a = v.indexOf("E-commerce & ");
    const out = patchPartRaw({ k: "jsx", raw, v }, a, a + "E-commerce & ".length, "");
    expect(out).toBe("Hans van Leeuwen — Marketplace Manager (Amazon &amp; Bol.com): ");
  });

  it("escapes inserted JSX specials", () => {
    const raw = "Price";
    const out = patchPartRaw({ k: "jsx", raw, v: "Price" }, 5, 5, " <€10 & {x}>");
    expect(out).toBe("Price &lt;€10 &amp; &#123;x&#125;&gt;");
    expect(decodeJsxText(out!).value).toBe("Price <€10 & {x}>");
  });

  it("patches across a collapsed line break", () => {
    const raw = "\n              Explore my\n              work\n            ";
    const v = decodeJsxText(raw).value; // "Explore my work"
    expect(v).toBe("Explore my work");
    const out = patchPartRaw({ k: "jsx", raw, v }, 8, 11, "our ");
    expect(out).not.toBeNull();
    expect(decodeJsxText(out!).value).toBe("Explore our work");
  });

  it("decodes and patches string literals", () => {
    expect(decodeJsString('"Explore my "')!.value).toBe("Explore my ");
    expect(decodeJsString("'it\\'s'")!.value).toBe("it's");
    expect(decodeJsString('"a\\u00e9\\n"')!.value).toBe("aé\n");
    expect(decodeJsString("`tpl ${x}`")).toBeNull();
    const out = patchPartRaw({ k: "str", raw: '"Explore my "', v: "Explore my " }, 0, 7, "See");
    expect(out).toBe('"See my "');
    const q = patchPartRaw({ k: "str", raw: '"say"', v: "say" }, 3, 3, ' "hi"');
    expect(q).toBe('"say \\"hi\\""');
    const t = patchPartRaw({ k: "tpl", raw: "`a`", v: "a" }, 1, 1, "`${b}`");
    expect(t).toBe("`a\\`\\${b}\\``");
    expect(encodeJsString("x'y", "'")).toBe("x\\'y");
  });

  it("refuses a part whose raw does not decode to its value", () => {
    expect(patchPartRaw({ k: "jsx", raw: "a &amp; b", v: "a &amp; b" }, 0, 1, "c")).toBeNull();
  });

  it("computes the minimal changed range", () => {
    expect(diffRange("abcdef", "abXYef")).toEqual({ p: 2, oldEnd: 4, newEnd: 4 });
    expect(diffRange("same", "same")).toEqual({ p: 4, oldEnd: 4, newEnd: 4 });
    expect(diffRange("aa", "aaa")).toEqual({ p: 2, oldEnd: 2, newEnd: 3 });
  });
});
