import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ArtistRadarDialog from "./ArtistRadarDialog";

vi.mock("@/components/music/ArtistRadarVisual", () => ({
  default: ({ active }: { active: boolean }) => <div data-testid="animated-radar" data-active={String(active)} />,
}));

vi.mock("@/components/music/ArtistRadarAccount", () => ({
  default: () => <section aria-label="Radar account testinhoud"><input aria-label="Favoriete artiest" /></section>,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn().mockResolvedValue({ data: { ok: true, events: [] }, error: null }) } },
}));

beforeEach(() => {
  vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { ok: true, events: [] }, error: null });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function RadarHarness({ initialTab = "account" }: { initialTab?: "account" | "discover" }) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button ref={opener} type="button" onClick={() => setOpen(true)}>Open Artist Radar</button>
      <ArtistRadarDialog open={open} onClose={() => setOpen(false)} initialTab={initialTab} returnFocusTo={opener} />
    </div>
  );
}

const dialog = () => screen.getByRole("dialog", { name: "Mis het moment niet." });
const openDialog = () => {
  const opener = screen.getByRole("button", { name: "Open Artist Radar" });
  opener.focus();
  fireEvent.click(opener);
  return opener;
};

function activateTab(tab: HTMLElement) {
  // Radix Tabs commits mouse selection on mousedown. JSDOM does not
  // synthesize the full mouse sequence from fireEvent.click alone.
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  fireEvent.click(tab);
}

describe("Artist Radar in-page dialog integration", () => {
  it("keeps the current music URL and animation, but blocks account registration before staging approval", () => {
    const originalPath = window.location.pathname + window.location.search + window.location.hash;
    render(<RadarHarness />);
    expect(screen.queryByRole("dialog")).toBeNull();
    openDialog();
    expect(dialog()).toBeTruthy();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(originalPath);
    expect(within(dialog()).getByTestId("animated-radar").getAttribute("data-active")).toBe("true");
    expect(within(dialog()).getByRole("tab", { name: "Mijn radar" }).getAttribute("aria-selected")).toBe("true");
    expect(within(dialog()).getByText("Je persoonlijke radar is in voorbereiding")).toBeTruthy();
    expect(within(dialog()).queryByRole("textbox", { name: "Favoriete artiest" })).toBeNull();
    expect(within(dialog()).getByRole("link", { name: /Zo gaan we met je gegevens om/ })).toBeTruthy();
    expect(within(dialog()).getByText(/Betalen doe je bij de verkoper/)).toBeTruthy();
    expect(within(dialog()).getByRole("link", { name: /Zo gaan we met je gegevens om/ }).getAttribute("target")).toBe("_blank");
  });

  it("supports keyboard-reachable navigation between account and discovery without leaving the dialog", async () => {
    render(<RadarHarness />);
    openDialog();
    activateTab(within(dialog()).getByRole("tab", { name: "Ontdek" }));
    expect(within(dialog()).getByRole("tab", { name: "Ontdek" }).getAttribute("aria-selected")).toBe("true");
    expect(dialog().querySelector('[role="tabpanel"][data-state="inactive"]')?.hasAttribute("hidden")).toBe(true);
    expect(within(dialog()).getByText(/Geruchten zijn geen bevestigde shows/)).toBeTruthy();
    await waitFor(() => expect(within(dialog()).getByText(/Geen recent geverifieerd concertsignaal/)).toBeTruthy());
    fireEvent.click(within(dialog()).getByRole("button", { name: /Mijn radar \(binnenkort\)/ }));
    expect(within(dialog()).getByRole("tab", { name: "Mijn radar" }).getAttribute("aria-selected")).toBe("true");
  });

  it("restores trigger focus on Close and does not scroll or navigate the background page", async () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    render(<RadarHarness />);
    const opener = openDialog();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Sluit Artist Radar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
    expect(scroll).not.toHaveBeenCalled();
  });

  it("allows Escape dismissal and honors the requested initial discover tab", async () => {
    render(<RadarHarness initialTab="discover" />);
    const opener = openDialog();
    expect(within(dialog()).getByRole("tab", { name: "Ontdek" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(dialog(), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("keeps the decorative radar out of the accessibility tree while exposing a textual journey", () => {
    render(<RadarHarness initialTab="discover" />);
    openDialog();
    const stage = within(dialog()).getByTestId("animated-radar").closest("[aria-hidden]");
    expect(stage?.getAttribute("aria-hidden")).toBe("true");
    expect(within(dialog()).getByRole("searchbox", { name: "Welke artiest wil je niet missen?" })).toBeTruthy();
    expect(within(dialog()).getByRole("button", { name: /Mijn radar \(binnenkort\)/ })).toBeTruthy();
  });

  it("shows legacy public concert data without mistaking it for verified ticket checkout", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { ok: true, events: [{
        artist_id: "fredagain", artist_name: "Fred again..", venue: "AFAS Live", city: "Amsterdam", country: "NL",
        event_date: "2026-12-10", sort_key: 20261210, status: "available", urgent: false,
      }] }, error: null,
    });
    render(<RadarHarness initialTab="discover" />);
    openDialog();
    await waitFor(() => expect(within(dialog()).getByText(/AFAS Live/)).toBeTruthy());
    expect(within(dialog()).getByText("Verkoop gemeld")).toBeTruthy();
    expect(within(dialog()).queryByRole("link", { name: /Tickets bij/ })).toBeNull();
  });

  it("never exposes a ticket link merely because an untrusted HTTPS URL is present", async () => {
    const checkedAt = new Date().toISOString();
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { ok: true, events: [{
        event_key: "unverified-01", artist_id: "fredagain", artist_name: "Fred again..", venue: "AFAS Live", city: "Amsterdam", country: "NL",
        event_date: "2026-12-10", sort_key: 20261210, status: "available", urgent: false,
        source: "official", source_checked_at: checkedAt,
        ticket: { url: "https://ticketmaster.nl.evil.example/pay", seller: "Ticketmaster", verified_at: checkedAt },
      }] }, error: null,
    });
    render(<RadarHarness initialTab="discover" />);
    openDialog();
    await waitFor(() => expect(within(dialog()).getByText(/AFAS Live/)).toBeTruthy());
    expect(within(dialog()).queryByRole("link", { name: /Tickets bij/ })).toBeNull();
  });

  it("offers a recoverable feed error without leaving the page or losing the artist search", async () => {
    const invoke = vi.mocked(supabase.functions.invoke);
    invoke.mockReset();
    invoke.mockRejectedValueOnce(new Error("network unavailable"));
    invoke.mockResolvedValueOnce({
      data: { ok: true, events: [{
        event_key: "verified-02", artist_id: "fredagain", artist_name: "Fred again..", venue: "AFAS Live", city: "Amsterdam", country: "NL",
        event_date: "2026-12-10", sort_key: 20261210, status: "announced", urgent: false,
      }] }, error: null,
    });
    render(<RadarHarness initialTab="discover" />);
    openDialog();
    const search = within(dialog()).getByRole("searchbox", { name: "Welke artiest wil je niet missen?" });
    fireEvent.change(search, { target: { value: "Fred" } });
    await waitFor(() => expect(within(dialog()).getByRole("alert")).toHaveTextContent(/tijdelijk niet beschikbaar/));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Opnieuw proberen" }));
    await waitFor(() => expect(within(dialog()).getByText(/AFAS Live/)).toBeTruthy());
    expect(search).toHaveValue("Fred");
    expect(window.location.pathname).not.toBe("/muziek/artist-radar");
    expect(invoke).toHaveBeenCalledTimes(2);
  });
});
