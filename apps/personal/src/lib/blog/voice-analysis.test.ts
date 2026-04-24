import { describe, it, expect } from "vitest";
import {
  analyzeVoice,
  computeCompleteness,
  extractOutline,
  type VoiceTemplate,
} from "./voice-analysis";

const template: VoiceTemplate = {
  id: "t1",
  name: "Test",
  formality: 6,
  humor: 3,
  respectfulness: 7,
  enthusiasm: 5,
  target_reading_level: 9,
  max_sentence_words: 24,
  passive_voice_max_pct: 10,
  avg_paragraph_sentences: 3,
  writing_style_rules: {},
  banned_words: ["utilize", "leverage"],
  preferred_terms: [],
};

describe("analyzeVoice", () => {
  it("returns 4 NNg axis scores in 0-10 range", () => {
    const a = analyzeVoice("A short paragraph. Another sentence here.", template);
    for (const v of [a.formality, a.humor, a.respectfulness, a.enthusiasm]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it("flags banned words", () => {
    const a = analyzeVoice(
      "We utilize many tools and leverage frameworks daily.",
      template
    );
    expect(a.violations.banned_word_hits).toEqual(
      expect.arrayContaining(["utilize", "leverage"])
    );
  });

  it("computes readability words and sentences", () => {
    const a = analyzeVoice("One. Two. Three.", template);
    expect(a.readability.sentences).toBe(3);
    expect(a.readability.words).toBeGreaterThan(0);
  });

  it("returns match_score between 0 and 100", () => {
    const a = analyzeVoice("Hello world.", template);
    expect(a.match_score).toBeGreaterThanOrEqual(0);
    expect(a.match_score).toBeLessThanOrEqual(100);
  });
});

describe("computeCompleteness", () => {
  it("awards points for filled fields", () => {
    const empty = computeCompleteness({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      primary_keyword: null,
      meta_title: null,
      meta_description: null,
      tags: [],
      image_url: "",
      voice_template_id: null,
    });
    const full = computeCompleteness({
      title: "Title",
      slug: "title",
      excerpt: "Excerpt text here for completeness",
      content: "Body ".repeat(80),
      primary_keyword: "keyword",
      meta_title: "Meta title",
      meta_description: "Meta description long enough to score",
      tags: ["one"],
      image_url: "https://example.com/x.png",
      voice_template_id: "uuid",
    });
    expect(empty).toBeLessThan(full);
    expect(full).toBeLessThanOrEqual(100);
  });
});

describe("extractOutline", () => {
  it("picks up H2 and H3 headings", () => {
    const md = "## Section one\nbody\n### Subpoint\ntext\n## Section two";
    const out = extractOutline(md);
    expect(out.map((o) => o.title)).toEqual(["Section one", "Subpoint", "Section two"]);
    expect(out.map((o) => o.level)).toEqual(["H2", "H3", "H2"]);
  });
});
