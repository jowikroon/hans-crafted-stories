import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// framer-motion whileInView heeft IntersectionObserver nodig; jsdom kent die niet.
class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: typeof IO }).IntersectionObserver = IO;

const getCaseStudies = vi.fn();
vi.mock("@/lib/api/content", () => ({ getCaseStudies: (...a: unknown[]) => getCaseStudies(...a) }));
vi.mock("@/hooks/usePageElements", () => ({ usePageElements: () => ({ isVisible: () => true }) }));
vi.mock("@/hooks/useCategoryCards", () => ({ useCategoryCards: () => ({ cards: [], loading: false }) }));
vi.mock("@/hooks/usePageContent", () => ({ usePageContent: () => ({ getValue: (_k: string, f: string) => f }) }));
vi.mock("@/hooks/useSEO", () => ({ useSEO: () => undefined }));
vi.mock("@/hooks/useLang", () => ({ useLang: () => ({ lang: "nl" }) }));

import Work from "./Work";
import { translations } from "@/data/translations";

const tw = translations.nl.work;
const row = { id: "1", title: "Small World", title_nl: "", category: "Typography", description: "d", description_nl: "", image: "", year: "2021", external_url: null };

describe("Work page", () => {
  it("always shows the marketplace case, even while CMS projects load", () => {
    getCaseStudies.mockReturnValueOnce(new Promise(() => { /* pending */ }));
    render(<MemoryRouter><Work /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: tw.casesHeading })).toBeInTheDocument();
    expect(screen.getAllByText(/automotive-parts retailer/).length).toBeGreaterThan(0);
  });

  it("shows a recoverable error instead of endless loading, and retries", async () => {
    getCaseStudies.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce([row]);
    render(<MemoryRouter><Work /></MemoryRouter>);
    expect(await screen.findByText(tw.loadError)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: tw.retry }));
    await waitFor(() => expect(screen.getByText("Small World")).toBeInTheDocument());
    // NL-categorielabel uit de vertaalmap
    expect(screen.getAllByText("Typografie").length).toBeGreaterThan(0);
  });
});
