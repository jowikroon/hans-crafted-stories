import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ArticleStoryBridge, { GIVING_ARTICLE_SLUG } from "./ArticleStoryBridge";

const renderBridge = (slug: string, articleLang: "nl" | "en") =>
  render(<MemoryRouter><ArticleStoryBridge slug={slug} articleLang={articleLang} /></MemoryRouter>);

describe("article-specific story bridge", () => {
  it("connects only the giving essay to the published Dutch album story", () => {
    renderBridge(GIVING_ARTICLE_SLUG, "nl");
    expect(screen.getByRole("heading", { name: "Een andere vorm" })).toBeTruthy();
    expect(screen.getByText(/In IETS MOOIS geef ik diezelfde belofte een stem/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Het verhaal achter IETS MOOIS/ }).getAttribute("href"))
      .toBe("/music/albums/iets-moois/brand");
    expect(screen.getByRole("link", { name: "Dan Martell" }).getAttribute("rel"))
      .toContain("noopener");
  });

  it("does not invent an English album route when an English article exists", () => {
    renderBridge(GIVING_ARTICLE_SLUG, "en");
    expect(screen.getByRole("heading", { name: "Another form" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /story in Dutch/ }).getAttribute("href"))
      .toBe("/music/albums/iets-moois/brand");
  });

  it("does not add music promotion to unrelated articles", () => {
    const { container } = renderBridge("een-andere-marketplace-analyse", "nl");
    expect(container).toBeEmptyDOMElement();
  });
});
