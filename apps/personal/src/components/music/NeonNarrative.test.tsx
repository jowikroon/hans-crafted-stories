import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { neonScenes } from "@/data/neonNarrative";
import NeonNarrative from "./NeonNarrative";

describe("NEON public narrative", () => {
  it("renders nine legible scenes, navigable anchors and the three-part code in the document", () => {
    const html = renderToString(<StaticRouter location="/music/albums/neon-the-signal-between/brand"><NeonNarrative /></StaticRouter>);
    const container = document.createElement("div");
    container.innerHTML = html;
    const story = container.querySelector(".nn-story")!;
    const chapters = story.querySelector(".nn-chapters")!;
    const chapterLinks = Array.from(chapters.querySelectorAll("a"));

    expect(story.querySelectorAll("h1")).toHaveLength(1);
    expect(chapterLinks).toHaveLength(9);
    expect(chapterLinks.map((link) => link.getAttribute("href"))).toEqual(Array.from({ length: 9 }, (_, index) => `#neon-scene-${index + 1}`));
    expect(story.querySelectorAll(".nn-scene")).toHaveLength(7);
    expect(story.querySelectorAll(".nn-cipher__card")).toHaveLength(3);
    expect(story.querySelectorAll(".nn-art")).toHaveLength(7);
    expect(story.textContent).toContain("Maak er iets moois van.");
    expect(story.textContent).toContain("Niet verbergen. Niet alles tegelijk.");
    expect(story.textContent).toContain("Dat moment heeft die gevoelens niet veroorzaakt.");
    expect(story.textContent).toContain("N = 1");
    expect(story.textContent).toContain("E = 2");
    expect(story.textContent).toContain("3 = ON");
    expect(story.textContent).toContain("geen definitieve volgorde van de nummers");
    expect(story.querySelectorAll('[hidden], [role="tabpanel"]')).toHaveLength(0);
    expect(story.querySelectorAll("img")).toHaveLength(1);
    expect(story.querySelector("img")?.getAttribute("src")).toBe("/images/albums/neon-front.webp");

    for (const id of chapterLinks.map((link) => link.getAttribute("href")!.slice(1))) {
      const scene = document.getElementById(id) ?? story.querySelector(`#${id}`);
      expect(scene).not.toBeNull();
      expect(scene?.getAttribute("tabindex")).toBe("-1");
      expect(story.querySelector(`#${scene?.getAttribute("aria-labelledby")}`)?.textContent).toBeTruthy();
    }
  });

  it("does not mistake musical echoes for private album release slots", () => {
    expect(neonScenes.map((scene) => scene.musicalEcho).filter(Boolean)).toEqual(["New Level", "Neon House of Glass", "Pressure", "Beat Drop"]);
    expect(neonScenes.every((scene) => scene.paragraphs.length >= 2 && scene.visualAlt)).toBe(true);
  });
});
