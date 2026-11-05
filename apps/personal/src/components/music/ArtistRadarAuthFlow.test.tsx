import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ArtistRadarAccount from "./ArtistRadarAccount";

const mock = vi.hoisted(() => ({
  user: null as null | { id: string; email: string },
  signOut: vi.fn(),
  sendOtp: vi.fn(),
  loadPublicRadarEvents: vi.fn(),
  listRadarFollows: vi.fn(),
  loadRadarPreferences: vi.fn(),
  listRadarActivity: vi.fn(),
  listRadarStatusHistory: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mock.user, loading: false, signOut: mock.signOut }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signInWithOtp: mock.sendOtp } },
}));
vi.mock("@/components/music/ArtistRadarTickets", () => ({
  default: () => <section aria-label="Test ticketoverzicht" />,
}));
vi.mock("@/lib/artistRadarAccount", () => ({
  CATEGORY_LABELS: { rumored: "Geruchten", announced: "Aankondigingen", available: "Ticketverkoop", sold_out: "Uitverkocht" },
  DEFAULT_RADAR_PREFERENCES: { countries: ["NL", "BE"], categories: ["rumored", "announced", "available", "sold_out"] },
  RADAR_CATEGORIES: ["rumored", "announced", "available", "sold_out"],
  RADAR_SUGGESTIONS: [{ id: "jowikroon", name: "Jowikroon", genre: "Electronic" }],
  radarStatusLabel: (status: string) => status,
  safeRadarArtist: (value: string) => value.trim().length > 1 ? { id: "jowikroon", name: value.trim(), genre: "Electronic" } : null,
  validRadarEmail: (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  addRadarFollow: vi.fn(),
  removeRadarFollow: vi.fn(),
  saveRadarPreferences: vi.fn(),
  loadPublicRadarEvents: mock.loadPublicRadarEvents,
  listRadarFollows: mock.listRadarFollows,
  loadRadarPreferences: mock.loadRadarPreferences,
  listRadarActivity: mock.listRadarActivity,
  listRadarStatusHistory: mock.listRadarStatusHistory,
}));

beforeEach(() => {
  vi.stubEnv("VITE_ARTIST_RADAR_NEWSLETTER_ENABLED", "false");
  mock.user = null;
  mock.sendOtp.mockReset().mockResolvedValue({ error: null });
  mock.signOut.mockReset().mockResolvedValue(undefined);
  mock.loadPublicRadarEvents.mockReset().mockResolvedValue({ events: [], checkedAt: "2026-11-05T12:00:00Z" });
  mock.listRadarFollows.mockReset().mockResolvedValue([]);
  mock.loadRadarPreferences.mockReset().mockResolvedValue({ countries: ["NL", "BE"], categories: ["available"] });
  mock.listRadarActivity.mockReset().mockResolvedValue([]);
  mock.listRadarStatusHistory.mockReset().mockResolvedValue([]);
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  window.history.replaceState({}, "", "/music?artist-radar=account");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function enterEmail(email: string) {
  fireEvent.change(screen.getByLabelText("E-mailadres"), { target: { value: email } });
  return screen.getByRole("button", { name: "Stuur inloglink" });
}

describe("Artist Radar account authentication and consent", () => {
  it("keeps invalid addresses out of the signup request and exposes no private controls while anonymous", () => {
    render(<ArtistRadarAccount />);
    const button = enterEmail("ongeldig-adres");
    expect(button).toBeDisabled();
    expect(mock.sendOtp).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Voorkeuren opslaan" })).toBeNull();
    expect(screen.queryByLabelText(/wekelijkse/i)).toBeNull();
  });

  it("requests a verified email account through the fixed callback without newsletter opt-in", async () => {
    render(<ArtistRadarAccount />);
    const button = enterEmail("  FAN@Example.NL ");
    fireEvent.click(button);
    await waitFor(() => expect(mock.sendOtp).toHaveBeenCalledWith({
      email: "fan@example.nl",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "http://localhost:3000/auth/callback?artist-radar=account",
      },
    }));
    expect(screen.getByText(/controleer je inbox/i)).toBeTruthy();
    expect(mock.listRadarFollows).not.toHaveBeenCalled();
  });

  it("shows a generic failure and allows another attempt without leaking provider diagnostics", async () => {
    mock.sendOtp.mockResolvedValueOnce({ error: { message: "secret provider trace" } }).mockResolvedValueOnce({ error: null });
    render(<ArtistRadarAccount />);
    const button = enterEmail("fan@example.nl");
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/inlogmail kon niet/i));
    expect(screen.getByRole("alert")).not.toHaveTextContent("secret provider trace");
    fireEvent.click(button);
    await waitFor(() => expect(mock.sendOtp).toHaveBeenCalledTimes(2));
  });

  it("loads an authenticated follower profile without silently subscribing to the weekly email", async () => {
    mock.user = { id: "user-one", email: "fan@example.nl" };
    mock.listRadarFollows.mockResolvedValue([{
      user_id: "user-one", artist_id: "jowikroon", artist_name: "Jowikroon", genre: "Electronic", created_at: "2026-11-05T12:00:00Z",
    }]);
    render(<ArtistRadarAccount />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Artiesten die ik volg" })).toBeTruthy());
    expect(screen.getByText(/Jowikroon/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Bevestigingsmail aanvragen" })).toBeNull();
    expect(mock.sendOtp).not.toHaveBeenCalled();
  });

  it("requires explicit newsletter consent and keeps sign-out available to the verified user", async () => {
    vi.stubEnv("VITE_ARTIST_RADAR_NEWSLETTER_ENABLED", "true");
    mock.user = { id: "user-one", email: "fan@example.nl" };
    mock.listRadarFollows.mockResolvedValue([{
      user_id: "user-one", artist_id: "jowikroon", artist_name: "Jowikroon", genre: "Electronic", created_at: "2026-11-05T12:00:00Z",
    }]);
    const fakeFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fakeFetch);
    render(<ArtistRadarAccount />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Bevestigingsmail aanvragen" })).toBeDisabled());
    expect(fakeFetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(/aparte aanmelding aanvragen/i));
    fireEvent.click(screen.getByRole("button", { name: "Bevestigingsmail aanvragen" }));
    await waitFor(() => expect(fakeFetch).toHaveBeenCalledTimes(1));
    const [url, options] = fakeFetch.mock.calls[0];
    expect(url).toBe("https://example.supabase.co/functions/v1/artist-radar-signup");
    expect(JSON.parse(options.body).email).toBe("fan@example.nl");
    fireEvent.click(screen.getByRole("button", { name: "Uitloggen" }));
    await waitFor(() => expect(mock.signOut).toHaveBeenCalledOnce());
  });
});
