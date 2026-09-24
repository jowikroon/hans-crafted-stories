import { stripEmDash, stripEmDashFields } from "./noEmDash";

const D = "—";

describe("stripEmDash", () => {
  it("leaves text without an em dash untouched", () => {
    expect(stripEmDash("Hans van Leeuwen, Marketplace Manager")).toBe("Hans van Leeuwen, Marketplace Manager");
    expect(stripEmDash(null)).toBeNull();
    expect(stripEmDash("")).toBe("");
  });

  it("turns an aside into a comma", () => {
    expect(stripEmDash(`no abstract framework ${D} just what happens each week`)).toBe("no abstract framework, just what happens each week");
    expect(stripEmDash(`Building effective agents ${D} Anthropic`)).toBe("Building effective agents, Anthropic");
  });

  it("keeps markdown links intact", () => {
    expect(stripEmDash(`- [Why language models hallucinate ${D} OpenAI](https://openai.com/x)`)).toBe(
      "- [Why language models hallucinate, OpenAI](https://openai.com/x)",
    );
  });

  it("uses a hyphen for number ranges", () => {
    expect(stripEmDash(`2019${D}2021`)).toBe("2019-2021");
    expect(stripEmDash(`2019 ${D} 2021`)).toBe("2019-2021");
    expect(stripEmDash(`1 ${D} 2 ${D} 3`)).toBe("1-2-3");
  });

  it("handles HTML entities too", () => {
    expect(stripEmDash("Discovery &mdash; audit")).toBe("Discovery, audit");
    expect(stripEmDash("A &#8212; B")).toBe("A, B");
  });

  it("drops leading and trailing dashes on a line", () => {
    expect(stripEmDash(`${D} a quote\n- ${D} item\nend ${D}`)).toBe("a quote\n- item\nend");
  });

  it("does not leave a comma before punctuation", () => {
    expect(stripEmDash(`Results ${D}.`)).toBe("Results.");
    expect(stripEmDash(`(${D} aside)`)).toBe("(aside)");
  });

  it("never returns an em dash", () => {
    const samples = [`a${D}b`, `${D}${D}`, `x ${D} ${D} y`, `${D}\n${D}`, `1 ${D} 2 ${D} 3`];
    for (const s of samples) expect(stripEmDash(s)).not.toContain(D);
  });
});

describe("stripEmDashFields", () => {
  it("cleans only the listed string fields and keeps identity when clean", () => {
    const clean = { title: "ok", content: "fine" };
    expect(stripEmDashFields(clean, ["title", "content"])).toBe(clean);
    const dirty = { title: `A ${D} B`, content: "fine", slug: `x${D}y` };
    const out = stripEmDashFields(dirty, ["title", "content"]);
    expect(out).not.toBe(dirty);
    expect(out.title).toBe("A, B");
    expect(out.slug).toBe(`x${D}y`);
  });
});
