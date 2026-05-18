import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSEO } from "./useSEO";

function SeoProbe({ enabled }: { enabled: boolean }) {
  useSEO({
    enabled,
    title: "Loading... | Hans van Leeuwen",
    description: "Loading description",
    url: "https://hansvanleeuwen.com/writing/loading",
  });
  return null;
}

describe("useSEO", () => {
  it("does not overwrite prerendered head tags while disabled", () => {
    document.title = "Prerendered Article | Hans van Leeuwen";

    render(<SeoProbe enabled={false} />);

    expect(document.title).toBe("Prerendered Article | Hans van Leeuwen");
  });

  it("cleans up managed canonical and social URL tags when disabled after a route change", () => {
    const { rerender } = render(<SeoProbe enabled={true} />);

    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      "https://hansvanleeuwen.com/writing/loading"
    );
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(
      "https://hansvanleeuwen.com/writing/loading"
    );

    rerender(<SeoProbe enabled={false} />);

    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('meta[property="og:url"]')).toBeNull();
    expect(document.querySelector('meta[name="twitter:url"]')).toBeNull();
  });
});
