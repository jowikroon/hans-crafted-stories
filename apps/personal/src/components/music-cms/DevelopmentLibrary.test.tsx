import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DevelopmentLibrary from "./DevelopmentLibrary";
import { filterDevelopmentPages, groupDevelopmentPages, libraryIndexPath, safeHostedUrl, type DevelopmentPage } from "./lib/developmentLibrary";

const pages: DevelopmentPage[] = [
  { id: "v6", title: "Example Cover Study", category: "Covers and branding", project: "example-study-v6", status: "Reference", local_path: "C:\\Album\\v6.html", source_modified: "2026-09-25", hosted_url: null },
  { id: "home", title: "Example Sequence Review", category: "Album and releases", project: "example-sequence", status: "Proposal", local_path: "C:\\Album\\home.html", source_modified: "2026-10-12", hosted_url: null },
];
afterEach(cleanup);
describe("private development library", () => {
  it("combines category and all search terms without changing version records", () => {
    expect(filterDevelopmentPages(pages, "Covers and branding", "STUDY V6")).toEqual([pages[0]]);
    expect(pages).toHaveLength(2);
    expect(libraryIndexPath([])).toBeNull();
    expect(libraryIndexPath([{ ...pages[0], local_path: "C:\\Album\\Pages\\v6\\index.html" }])).toBe("C:\\Album\\index.html");
    expect(safeHostedUrl("javascript:alert(1)")).toBeNull();
    expect(safeHostedUrl("file:///C:/Album/home.html")).toBeNull();
    expect(safeHostedUrl("https://hansvanleeuwen.com/preview")).toBeTruthy();
  });
  it("copies the original page location rather than making a broken web-to-file link", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<DevelopmentLibrary pages={pages} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Sequence" } });
    fireEvent.click(screen.getByRole("button", { name: "Kopieer pad" }));
    expect(writeText).toHaveBeenCalledWith(pages[1].local_path);
    expect(await screen.findByText(/Pad gekopieerd/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open online" })).not.toBeInTheDocument();
  });
  it("groups only identical hashes and preserves unknown or changed versions", () => {
    const source = { ...pages[0], source_sha256: "same", source_origin: "AI-project" };
    const copy = { ...source, id: "copy", source_origin: "Vault" };
    const changed = { ...source, id: "changed", source_sha256: "different" };
    const groups = groupDevelopmentPages([copy, source, changed, pages[1]]);
    expect(groups).toHaveLength(3);
    expect(groups[0].page).toEqual(source);
    expect(groups[0].copies).toHaveLength(2);
  });
  it("resets category, status and search together after zero results", () => {
    render(<DevelopmentLibrary pages={pages} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "missing" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Status" }), { target: { value: "Reference" } });
    fireEvent.click(screen.getByRole("button", { name: "Bekijk alle pagina’s" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue("");
    expect(screen.getByText("Example Sequence Review")).toBeInTheDocument();
  });
  it("provides a selectable path if clipboard access is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    render(<DevelopmentLibrary pages={[pages[0]]} />);
    fireEvent.click(screen.getByRole("button", { name: "Kopieer pad" }));
    expect(await screen.findByRole("textbox", { name: "Pad om te kopiëren" })).toHaveValue(pages[0].local_path);
  });
});
