import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ArtistRadarTickets from "./ArtistRadarTickets";

const mocks = vi.hoisted(() => ({
  userId: null as string | null,
  loadPublicRadarEvents: vi.fn(),
  listRadarFollows: vi.fn(),
  recordRadarTicketLinkOpen: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mocks.userId ? { id: mocks.userId } : null, loading: false }),
}));
vi.mock("@/lib/artistRadarAccount", () => ({
  loadPublicRadarEvents: mocks.loadPublicRadarEvents,
  listRadarFollows: mocks.listRadarFollows,
  recordRadarTicketLinkOpen: mocks.recordRadarTicketLinkOpen,
}));

const recent = () => new Date(Date.now() - 3600000).toISOString();
const available = () => ({
  event_key: "event-123", artist_id: "froukje", artist_name: "Froukje", venue: "AFAS Live",
  city: "Amsterdam", country: "NL", event_date: "2026-12-14", sort_key: 20261214,
  status: "available", urgent: false, source: "AFAS Live", source_checked_at: recent(),
  ticket: { url: "https://www.ticketmaster.nl/event/froukje", seller: "Ticketmaster", verified_at: recent() },
});
const soldOut = () => ({
  ...available(), event_key: "event-456", artist_id: "stromae", artist_name: "Stromae",
  venue: "Ziggo Dome", sort_key: 20261215, status: "sold_out", ticket: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.userId = null;
  mocks.loadPublicRadarEvents.mockResolvedValue({ events: [available(), soldOut()], checkedAt: recent() });
  mocks.listRadarFollows.mockResolvedValue([]);
  mocks.recordRadarTicketLinkOpen.mockResolvedValue(undefined);
});
afterEach(() => cleanup());

describe("ArtistRadarTickets account view", () => {
  it("shows a verified seller CTA and a non-clickable sold-out status with the visitor still on this site", async () => {
    render(<ArtistRadarTickets />);
    const buy = await screen.findByRole("link", { name: /Tickets kopen voor Froukje bij Ticketmaster/ });
    expect(buy).toHaveAttribute("href", "https://www.ticketmaster.nl/event/froukje");
    expect(buy).toHaveAttribute("target", "_blank");
    expect(buy).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getAllByText("Uitverkocht").length).toBeGreaterThan(0);
    expect(screen.getByText(/Een klik is geen aankoopbevestiging/)).toBeInTheDocument();
  });

  it("never renders a buy link for stale or unverified sale data", async () => {
    mocks.loadPublicRadarEvents.mockResolvedValue({
      events: [{ ...available(), ticket: null }, { ...soldOut(), status: "announced" }], checkedAt: recent(),
    });
    render(<ArtistRadarTickets />);
    await screen.findByText("Froukje");
    expect(screen.queryByRole("link", { name: /Tickets kopen/ })).toBeNull();
    expect(screen.getByText("Verkooplink wordt gecontroleerd")).toBeInTheDocument();
    expect(screen.getByText("Verkoop volgt")).toBeInTheDocument();
  });

  it("filters the account to followed artists and logs a click as a link opening only", async () => {
    mocks.userId = "fan-id-1";
    mocks.listRadarFollows.mockResolvedValue([{ artist_id: "froukje", artist_name: "Froukje" }]);
    render(<ArtistRadarTickets />);
    const buy = await screen.findByRole("link", { name: /Tickets kopen voor Froukje bij Ticketmaster/ });
    expect(screen.queryByText("Stromae")).toBeNull();
    fireEvent.click(buy);
    await waitFor(() => expect(mocks.recordRadarTicketLinkOpen).toHaveBeenCalledWith(
      "fan-id-1", "froukje", "Froukje", "event-123", "Ticketmaster",
    ));
  });

  it("offers an accessible status filter instead of making all events look buyable", async () => {
    render(<ArtistRadarTickets />);
    await screen.findByText("Froukje");
    fireEvent.change(screen.getByRole("combobox", { name: "Verkoopstatus" }), { target: { value: "sold_out" } });
    expect(screen.queryByText("Froukje")).toBeNull();
    expect(screen.getByText("Stromae")).toBeInTheDocument();
  });

  it("distinguishes an inaccessible account follow list from an intentionally empty list", async () => {
    mocks.userId = "fan-id-2";
    mocks.listRadarFollows.mockRejectedValue(new Error("RLS test failure"));
    render(<ArtistRadarTickets />);
    expect(await screen.findByText(/Je gevolgde artiesten konden niet worden geladen/)).toBeInTheDocument();
    expect(screen.getByText("Froukje")).toBeInTheDocument();
  });

  it("shows a genuine feed error without pretending no concerts are planned", async () => {
    mocks.loadPublicRadarEvents.mockRejectedValue(new Error("offline"));
    render(<ArtistRadarTickets />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/concertinformatie is tijdelijk niet bereikbaar/);
    expect(screen.queryByText(/Geen actuele concerten/)).toBeNull();
  });
});
