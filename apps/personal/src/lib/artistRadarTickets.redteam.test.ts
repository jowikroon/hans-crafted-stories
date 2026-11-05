import { describe, expect, it } from "vitest";
import {
  recentTicketVerification, trustedTicketSeller, verifiedTicketOffer,
  TICKET_VERIFICATION_MAX_AGE_MS, type RadarTicketEvent,
} from "./artistRadarTickets";

const NOW = Date.parse("2026-11-05T12:00:00.000Z");
const RECENT = new Date(NOW - 5 * 60_000).toISOString();
const EVENT: RadarTicketEvent = {
  event_key: "valid-show-id",
  artist_id: "act-1", artist_name: "Official Artist",
  venue: "Example Venue", city: "Amsterdam", country: "NL",
  event_date: "2026-11-20", sort_key: 20261120,
  status: "available", urgent: false, source: "Concertzaal", source_checked_at: RECENT,
  ticket: { url: "https://www.ticketmaster.nl/event/123", seller: "Unknown Vendor", verified_at: RECENT },
};

describe("Artist Radar red-team ticket URL boundaries", () => {
  it("rejects deceptive suffixes, IDN homographs, IP endpoints and encoded-host tricks", () => {
    const deceptive = [
      "https://ticketmaster.nl.evil.test/", "https://evil-ticketmaster.nl/",
      "https://ticketmaster-nl.com/", "https://ticketmastеr.nl/", // Cyrillic 'е'
      "https://127.0.0.1/event", "https://192.168.0.1/event",
      "https://ticketmaster.nl%40evil.test/event", "https://tickets.example.test/event",
    ];
    for (const url of deceptive) expect(trustedTicketSeller(url), url).toBeNull();
  });

  it("rejects schemes, credentials, and custom ports without blocking canonical HTTPS subdomains", () => {
    for (const url of [
      "http://ticketmaster.nl/event", "ftp://ticketmaster.nl/event",
      "javascript:alert(1)", "data:text/html,test", "//ticketmaster.nl/event",
      "https://ticketmaster.nl@evil.test/event",
      "https://alice:secret@ticketmaster.nl/event",
      "https://ticketmaster.nl:8443/event",
    ]) expect(trustedTicketSeller(url), url).toBeNull();
    expect(trustedTicketSeller("https://www.ticketmaster.nl:443/event")?.seller).toBe("Ticketmaster");
  });

  it("enforces exact seven-day freshness, future timestamps, and both independent checks", () => {
    const boundary = new Date(NOW - TICKET_VERIFICATION_MAX_AGE_MS).toISOString();
    expect(recentTicketVerification(boundary, NOW)).toBe(true);
    expect(recentTicketVerification(new Date(NOW - TICKET_VERIFICATION_MAX_AGE_MS - 1).toISOString(), NOW)).toBe(false);
    expect(recentTicketVerification(new Date(NOW + 1).toISOString(), NOW)).toBe(false);
    expect(recentTicketVerification("not-a-date", NOW)).toBe(false);
    expect(verifiedTicketOffer({ ...EVENT, source_checked_at: null }, NOW)).toBeNull();
    expect(verifiedTicketOffer({ ...EVENT, ticket: { ...EVENT.ticket!, verified_at: "nope" } }, NOW)).toBeNull();
  });

  it("never upgrades sold-out, announced or rumoured concerts to a purchase link", () => {
    for (const status of ["sold_out", "announced", "rumored"] as const) {
      expect(verifiedTicketOffer({ ...EVENT, status }, NOW)).toBeNull();
    }
    expect(verifiedTicketOffer({ ...EVENT, ticket: null }, NOW)).toBeNull();
  });

  it("derives the seller label from the verified hostname, not attacker-controlled text", () => {
    const offer = verifiedTicketOffer({
      ...EVENT, ticket: { ...EVENT.ticket!, seller: "<script>Fake tickets</script>" },
    }, NOW);
    expect(offer?.seller).toBe("Ticketmaster");
    expect(offer?.url).toBe("https://www.ticketmaster.nl/event/123");
  });
});
