import { describe, expect, it } from "vitest";
import { drivePageLinks } from "./developmentLibrary";
import { matchArtwork, prepareDevelopmentDocument } from "./developmentReader";
import type { ArtworkAsset } from "./artworkModel";

describe("private Drive development reader", () => {
  it("only builds downloads from canonical Google Drive file links", () => {
    expect(drivePageLinks("https://drive.google.com/file/d/file_123/view?usp=sharing")?.download).toBe("https://drive.google.com/uc?export=download&id=file_123");
    for (const url of ["https://drive.google.com.evil.test/file/d/a/view", "file:///C:/a.html", "javascript:alert(1)", "https://evil@drive.google.com/file/d/a/view", "https://drive.google.com/open?id=a"]) expect(drivePageLinks(url)).toBeNull();
  });
  it("matches complete collection paths, never similar filenames or ambiguous versions", () => {
    const a = { id: "one", origins: [{ collection: "study-v6", file: "artwork/cover.jpg", version: "v6" }] } as ArtworkAsset;
    expect(matchArtwork("file:///C:/AI/output/study-v6/artwork/cover.jpg", "", [a])).toBe(a);
    expect(matchArtwork("artwork/cover.jpg", "C:/Album/Pages/study-v6/index.html", [a])).toBe(a);
    expect(matchArtwork("file:///C:/AI/output/study-v7/artwork/cover.jpg", "", [a])).toBeNull();
    expect(matchArtwork("artwork/cover.jpg", "C:/Album/Pages/study-v6/index.html", [a, { ...a, id: "two" }])).toBeNull();
  });
  it("keeps layout and mapped private images while stripping active or leaking content", () => {
    const result = prepareDevelopmentDocument('<style>h1{color:purple}</style><script>steal()</script><base href="https://evil.test"><meta http-equiv="refresh" content="0;url=https://evil.test"><h1 onclick="steal()">NEON</h1><img src="file:///cover.jpg" srcset="https://evil.test/x 2x"><img src="file:///missing.jpg"><iframe src="https://evil.test"></iframe><form action="https://evil.test"><input></form><a href="javascript:steal()">bad</a>', new Map([["file:///cover.jpg", "https://private.r2.cloudflarestorage.com/cover?signature=test"]]));
    const doc = new DOMParser().parseFromString(result.html, "text/html");
    expect(doc.querySelectorAll("script,iframe,base,form,[onclick],[srcset]")).toHaveLength(0);
    expect(doc.querySelector("h1")?.textContent).toBe("NEON");
    expect(doc.querySelector("img")?.getAttribute("src")).toContain("private.r2");
    expect(doc.querySelector("a")?.hasAttribute("href")).toBe(false);
    expect(doc.head.firstElementChild?.getAttribute("content")).toContain("script-src 'none'");
    expect(result.missing).toBe(1);
  });
});
