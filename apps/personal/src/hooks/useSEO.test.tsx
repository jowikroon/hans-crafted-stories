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
});
