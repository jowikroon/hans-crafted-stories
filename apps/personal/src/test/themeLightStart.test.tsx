import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import indexHtml from "../../index.html?raw";
import { ThemeProvider, useForcedTheme, useLightOnRouteChange, useTheme } from "@/hooks/useTheme";
import { useSkin } from "@/hooks/useSkin";
import { useLocation } from "react-router-dom";

/* "Altijd licht starten" (2026-09-23): regressietests voor pre-paint + React. */

const scripts = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const themeGuard = scripts.find((s) => s.includes("ALTIJD LICHT STARTEN"));
const skinInit = scripts.find((s) => s.includes("writing_skin"));
const run = (code: string | undefined) => {
  if (!code) throw new Error("script niet gevonden in index.html");
  // eslint-disable-next-line no-new-func -- test voert het echte inline script uit
  new Function(code)();
};

const setOsDark = (dark: boolean) => {
  const listeners = new Set<(e: { matches: boolean }) => void>();
  window.matchMedia = ((query: string) => ({
    matches: dark && query.includes("dark"),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.delete(fn),
    dispatchEvent: () => true,
  })) as unknown as typeof window.matchMedia;
  return { fire: (matches: boolean) => listeners.forEach((fn) => fn({ matches })) };
};

const html = () => document.documentElement;
const themeColor = () => document.querySelector('meta[name="theme-color"]')?.getAttribute("content");

beforeEach(() => {
  localStorage.clear();
  html().className = "";
  html().removeAttribute("data-skin");
  html().style.colorScheme = "";
  document.head.innerHTML = '<meta name="theme-color" content="#ffffff" />';
  setOsDark(false);
});
afterEach(() => vi.restoreAllMocks());

describe("index.html pre-paint guard", () => {
  it("starts light with OS dark + stored site_theme=dark + a stale dark class", () => {
    setOsDark(true);
    localStorage.setItem("site_theme", "dark");
    html().classList.add("dark");
    run(themeGuard);
    expect(html().classList.contains("dark")).toBe(false);
    expect(html().style.colorScheme).toBe("light");
    expect(themeColor()).toBe("#FAF8F2");
  });

  it("starts light when localStorage is blocked (throws)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    html().classList.add("dark");
    run(themeGuard);
    expect(html().classList.contains("dark")).toBe(false);
  });

  it("declares a light color-scheme so the UA canvas never flashes dark", () => {
    expect(indexHtml).toMatch(/<meta name="color-scheme" content="light"\s*\/?>/);
    expect(indexHtml).not.toMatch(/prefers-color-scheme: dark\)"\)\.matches/);
  });

  it("ignores a stored mono-dark writing skin but keeps light skins", () => {
    localStorage.setItem("writing_skin", "mono-dark");
    run(skinInit);
    expect(html().hasAttribute("data-skin")).toBe(false);
    localStorage.setItem("writing_skin", "paper");
    run(skinInit);
    expect(html().getAttribute("data-skin")).toBe("paper");
  });

  it("skin init survives invalid and blocked storage", () => {
    localStorage.setItem("writing_skin", "<script>");
    run(skinInit);
    expect(html().hasAttribute("data-skin")).toBe(false);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(() => run(skinInit)).not.toThrow();
  });
});

/* Harness: ThemeProvider + router + the same route-reset hook the app mounts. */
const Probe = () => {
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();
  const { pathname } = useLocation();
  useLightOnRouteChange(pathname);
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
      <button onClick={() => nav("/work")}>go-work</button>
      <button onClick={() => nav("/nl/work")}>go-nl</button>
      <button onClick={() => nav("/nl/work#contact")}>go-hash</button>
      <button onClick={() => nav(-1)}>back</button>
    </div>
  );
};
const mount = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    </MemoryRouter>,
  );

describe("ThemeProvider: altijd licht starten", () => {
  it("starts light despite OS dark and stored site_theme=dark", () => {
    setOsDark(true);
    localStorage.setItem("site_theme", "dark");
    mount("/writing");
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(html().classList.contains("dark")).toBe(false);
  });

  it("manual dark applies to the current page only and is not persisted", () => {
    mount("/");
    fireEvent.click(screen.getByText("toggle"));
    expect(html().classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("site_theme")).toBeNull();
    fireEvent.click(screen.getByText("go-work"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(html().classList.contains("dark")).toBe(false);
    expect(themeColor()).toBe("#FAF8F2");
  });

  it("language switch and back/forward start light; hash-only change keeps the page choice", () => {
    mount("/work");
    fireEvent.click(screen.getByText("go-nl"));
    fireEvent.click(screen.getByText("toggle"));
    expect(html().classList.contains("dark")).toBe(true);
    fireEvent.click(screen.getByText("go-hash")); // zelfde pathname, alleen hash
    expect(html().classList.contains("dark")).toBe(true);
    fireEvent.click(screen.getByText("back")); // terug naar /nl/work: zelfde pad, keuze blijft
    expect(html().classList.contains("dark")).toBe(true);
    fireEvent.click(screen.getByText("back")); // terug naar /work: andere pagina, begint licht
    expect(html().classList.contains("dark")).toBe(false);
  });

  it("ignores storage events and OS changes while a page is open", () => {
    const os = setOsDark(false);
    mount("/");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "site_theme", newValue: "dark" }));
      os.fire(true);
    });
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(html().classList.contains("dark")).toBe(false);
  });
});

describe("useForcedTheme cleanup", () => {
  it("returns to light (never to a stored/OS dark preference) on unmount", () => {
    setOsDark(true);
    localStorage.setItem("site_theme", "dark");
    const Forced = () => {
      useForcedTheme("dark");
      return null;
    };
    const { unmount } = render(<Forced />);
    expect(html().classList.contains("dark")).toBe(true);
    unmount();
    expect(html().classList.contains("dark")).toBe(false);
  });
});

describe("useSkin: dark skin is page-local", () => {
  const SkinProbe = () => {
    const { skin, setSkin } = useSkin();
    const nav = useNavigate();
    return (
      <div>
        <span data-testid="skin">{skin}</span>
        <button onClick={() => setSkin("mono-dark")}>dark-skin</button>
        <button onClick={() => setSkin("paper")}>paper</button>
        <button onClick={() => nav("/writing/some-article")}>go-article</button>
      </div>
    );
  };
  const mountSkin = () =>
    render(
      <MemoryRouter initialEntries={["/writing"]}>
        <SkinProbe />
      </MemoryRouter>,
    );

  it("a stored mono-dark does not start /writing dark", () => {
    localStorage.setItem("writing_skin", "mono-dark");
    mountSkin();
    expect(screen.getByTestId("skin").textContent).toBe("editorial-light");
    expect(html().hasAttribute("data-skin")).toBe(false);
  });

  it("choosing mono-dark is not stored and ends at the next route; light skins are remembered", () => {
    mountSkin();
    fireEvent.click(screen.getByText("paper"));
    expect(localStorage.getItem("writing_skin")).toBe("paper");
    fireEvent.click(screen.getByText("dark-skin"));
    expect(html().getAttribute("data-skin")).toBe("mono-dark");
    expect(localStorage.getItem("writing_skin")).toBe("paper");
    fireEvent.click(screen.getByText("go-article"));
    expect(screen.getByTestId("skin").textContent).toBe("paper");
    expect(html().getAttribute("data-skin")).toBe("paper");
  });
});
