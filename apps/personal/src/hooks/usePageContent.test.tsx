import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/lib/api/pageContent", () => ({
  getPageContent: vi.fn(async () => [
    { content_key: "about_h1", content_value: "English CMS heading" },
    { content_key: "about_label_nl", content_value: "Over (CMS)" },
    { content_key: "about_linkedin_url", content_value: "https://linkedin.com/in/example" },
  ]),
}));

const langState = { lang: "nl" as "nl" | "en" };
vi.mock("@/hooks/useLang", () => ({ useLang: () => langState }));

import { usePageContent } from "./usePageContent";

describe("usePageContent getValue fallback order", () => {
  it("NL: an English base row no longer overrides the Dutch code fallback", async () => {
    langState.lang = "nl";
    const { result } = renderHook(() => usePageContent("about"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.getValue("about_h1", "Nederlandse kop")).toBe("Nederlandse kop");
    expect(result.current.getValue("about_label", "Over")).toBe("Over (CMS)");
    // taalneutrale sleutels mogen de basis-rij gebruiken
    expect(result.current.getValue("about_linkedin_url", "x", { neutral: true })).toBe("https://linkedin.com/in/example");
  });

  it("EN: the base CMS row still overrides the code fallback", async () => {
    langState.lang = "en";
    const { result } = renderHook(() => usePageContent("about"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.getValue("about_h1", "Code heading")).toBe("English CMS heading");
  });
});
