import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mock = vi.hoisted(() => ({
  user: null as null | { id: string; email: string },
  loading: false,
  otp: vi.fn(),
  signOut: vi.fn(),
  listFollows: vi.fn(),
  listPreferences: vi.fn(),
  listActivity: vi.fn(),
  listHistory: vi.fn(),
  loadEvents: vi.fn(),
  follow: vi.fn(),
  unfollow: vi.fn(),
  savePreferences: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: mock.user, loading: mock.loading, signOut: mock.signOut }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signInWithOtp: mock.otp } } }));
vi.mock("@/components/music/ArtistRadarTickets", () => ({ default: () => <div data-testid="radar-ticket-panel">Tickets</div> }));
vi.mock("@/lib/artistRadarAccount", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/artistRadarAccount")>();
  return {
    ...actual,
    listRadarFollows: mock.listFollows,
    loadRadarPreferences: mock.listPreferences,
    listRadarActivity: mock.listActivity,
    listRadarStatusHistory: mock.listHistory,
    loadPublicRadarEvents: mock.loadEvents,
    addRadarFollow: mock.follow,
    removeRadarFollow: mock.unfollow,
    saveRadarPreferences: mock.savePreferences,
  };
});

import ArtistRadarAccount from "./ArtistRadarAccount";

const viewer = { id: "8df7b8ee-56f5-4c69-b371-a7ce7a0c135f", email: "radar@example.nl" };
const froukje = { user_id: viewer.id, artist_id: "froukje", artist_name: "Froukje", genre: "Pop", created_at: "2026-11-05T12:00:00Z" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VITE_ARTIST_RADAR_NEWSLETTER_ENABLED", "false");
  mock.user = null;
  mock.loading = false;
  mock.otp.mockResolvedValue({ error: null });
  mock.signOut.mockResolvedValue(undefined);
  mock.listFollows.mockResolvedValue([]);
  mock.listPreferences.mockResolvedValue({ countries: ["NL", "BE"], categories: ["rumored", "announced", "available", "sold_out"] });
  mock.listActivity.mockResolvedValue([]);
  mock.listHistory.mockResolvedValue([]);
  mock.loadEvents.mockResolvedValue({ events: [], checkedAt: "2026-11-05T12:00:00Z" });
  mock.follow.mockResolvedValue(undefined);
  mock.unfollow.mockResolvedValue(undefined);
  mock.savePreferences.mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("persoonlijk Artist Radar account", () => {
  it("requests a fixed-origin email magic link without newsletter opt-in", async () => {
    render(<ArtistRadarAccount />);
    fireEvent.change(screen.getByLabelText("E-mailadres"), { target: { value: "HELLO@example.nl" } });
    fireEvent.click(screen.getByRole("button", { name: /Stuur inloglink/ }));
    await waitFor(() => expect(mock.otp).toHaveBeenCalledTimes(1));
    expect(mock.otp.mock.calls[0][0]).toEqual({
      email: "hello@example.nl",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?artist-radar=account`,
      },
    });
    expect(screen.getByRole("status").textContent).toMatch(/controleer je inbox/i);
    expect(screen.queryByRole("button", { name: /Bevestigingsmail aanvragen/ })).toBeNull();
  });

  it("shows owned follows and a factual source label, never a ticket purchase claim", async () => {
    mock.user = viewer;
    mock.listFollows.mockResolvedValue([froukje]);
    mock.loadEvents.mockResolvedValue({
      events: [{ artist_id: "froukje", artist_name: "Froukje", country: "NL", venue: "Zaal", city: "Utrecht", event_date: "2026-11-28", sort_key: 20261128, status: "announced", urgent: false }],
      checkedAt: "2026-11-05T12:00:00Z",
    });
    render(<ArtistRadarAccount />);
    expect(await screen.findByText(/Eerstvolgende gemelde show:/)).toHaveTextContent("Aangekondigd · Utrecht · 2026-11-28");
    expect(screen.getByText("Froukje")).toBeInTheDocument();
    expect(screen.getByTestId("radar-ticket-panel")).toBeInTheDocument();
    // Empty staging has no newsletter function; never offer a broken send button.
    expect(screen.queryByRole("button", { name: "Bevestigingsmail aanvragen" })).toBeNull();
  });

  it("does not misrepresent an empty verified feed as absence of concerts", async () => {
    mock.user = viewer;
    mock.listFollows.mockResolvedValue([froukje]);
    render(<ArtistRadarAccount />);
    expect(await screen.findByText(/Geen recent geverifieerd concertsignaal/)).toHaveTextContent(
      /Dit betekent niet dat er geen optredens zijn/,
    );
  });

  it("adds and removes followed artists through private account helpers", async () => {
    mock.user = viewer;
    mock.listFollows.mockResolvedValueOnce([]).mockResolvedValueOnce([froukje]).mockResolvedValueOnce([]);
    render(<ArtistRadarAccount />);
    await screen.findByText(/Je volgt nog niemand/);
    fireEvent.change(screen.getByLabelText("Artiest toevoegen"), { target: { value: "Froukje" } });
    fireEvent.click(screen.getByRole("button", { name: "Volgen" }));
    await waitFor(() => expect(mock.follow).toHaveBeenCalledWith(viewer.id, { id: "froukje", name: "Froukje", genre: "Pop" }));
    await screen.findByRole("button", { name: "Stop met volgen van Froukje" });
    fireEvent.click(screen.getByRole("button", { name: "Stop met volgen van Froukje" }));
    await waitFor(() => expect(mock.unfollow).toHaveBeenCalledWith(viewer.id, froukje));
  });

  it("saves selected notification categories but not a newsletter subscription", async () => {
    mock.user = viewer;
    render(<ArtistRadarAccount />);
    await screen.findByRole("button", { name: "Voorkeuren opslaan" });
    fireEvent.click(screen.getByLabelText("Geruchten"));
    fireEvent.click(screen.getByRole("button", { name: "Voorkeuren opslaan" }));
    await waitFor(() => expect(mock.savePreferences).toHaveBeenCalledWith(viewer.id, {
      countries: ["NL", "BE"], categories: ["announced", "available", "sold_out"],
    }));
    expect(mock.otp).not.toHaveBeenCalled();
  });

  it("never silently presents a missing staging schema as empty account history", async () => {
    mock.user = viewer;
    mock.listFollows.mockRejectedValue(new Error("Je gevolgde artiesten konden niet worden geladen."));
    render(<ArtistRadarAccount />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/Je gevolgde artiesten konden niet worden geladen/);
    expect(screen.queryByText(/Nog geen activiteiten opgeslagen/)).toBeNull();
    expect(screen.queryByTestId("radar-ticket-panel")).toBeNull();
  });

  it("refreshes real ticket-link click history after a successful ticket-panel write", async () => {
    mock.user = viewer;
    mock.listActivity.mockResolvedValueOnce([]).mockResolvedValueOnce([{
      id: "click-1", kind: "ticket_link_opened", artist_id: "froukje", artist_name: "Froukje",
      event_key: "show-1", provider: "Ticketmaster", created_at: "2026-11-05T12:00:00Z",
    }]);
    render(<ArtistRadarAccount />);
    await screen.findByText(/Nog geen activiteiten opgeslagen/);
    act(() => window.dispatchEvent(new Event("artist-radar:activity")));
    expect(await screen.findByText(/Ticketlink geopend voor Froukje/)).toHaveTextContent(/geen aankoopbewijs/);
  });

  it("requires distinct explicit consent before requesting the old double-opt-in newsletter", async () => {
    mock.user = viewer;
    mock.listFollows.mockResolvedValue([froukje]);
    vi.stubEnv("VITE_ARTIST_RADAR_NEWSLETTER_ENABLED", "true");
    vi.stubEnv("VITE_SUPABASE_URL", "https://radar-project.supabase.co");
    const post = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", post);
    render(<ArtistRadarAccount />);
    const subscribe = await screen.findByRole("button", { name: "Bevestigingsmail aanvragen" });
    expect(subscribe).toBeDisabled();
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(/Ik wil een aparte aanmelding aanvragen/));
    fireEvent.click(subscribe);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe("https://radar-project.supabase.co/functions/v1/artist-radar-signup");
    expect(JSON.parse(post.mock.calls[0][1].body)).toMatchObject({
      email: viewer.email, artists: [{ id: "froukje", name: "Froukje", genre: "Pop" }],
    });
    expect(await screen.findByRole("status")).toHaveTextContent(/aparte bevestigingsmail/i);
  });
});
