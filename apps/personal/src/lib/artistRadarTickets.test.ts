import { describe, expect, it } from "vitest";
import type { RadarTicketEvent } from "./artistRadarTickets";
import {
  readableEventDate, recentTicketVerification, trustedTicketSeller, verifiedTicketOffer,
} from "./artistRadarTickets";

const NOW = Date.parse("2026-11-05T12:00:00Z");
const fresh = "2026-11-05T11:45:00Z";
const base: RadarTicketEvent = {
  event_key: "event-abc",
  artist_id: "froukje", artist_name: "Froukje", venue: "AFAS Live", city: "Amsterdam",
  country: "NL", event_date: "2026-11-22", sort_key: 20261122,
  status: "available", urgent: false, source: "venue", source_checked_at: fresh,
  ticket: { url: "https://www.ticketmaster.nl/event/12345", seller: "Ticketmaster", verified_at: fresh },
};

describe("Artist Radar verified ticket CTA", () => {
  it("accepts only a recent HTTPS official seller link", () => {
    expect(verifiedTicketOffer(base, NOW)).toEqual({ url: base.ticket?.url, seller: "Ticketmaster" });
  });
  it("blocks unrelated hosts, userinfo disguises, cleartext, unknown protocols and lookalikes", () => {
    for (const link of [
      "https://ticketmaster.nl.evil.test/event", "https://ticketmaster.nl@evil.test/",
      "http://ticketmaster.nl/event", "javascript:alert(1)", "https://tickets.example.test/",
      "https://ticketmaster.nl:8443/event", "https://user:secret@ticketmaster.nl/event",
    ]) {
      expect(trustedTicketSeller(link)).toBeNull();
      expect(verifiedTicketOffer({ ...base, ticket: { ...base.ticket!, url: link } }, NOW)).toBeNull();
    }
  });
  it("does not mistake sale rumors, announced dates or sold-out tickets for buyable stock", () => {
    for (const status of ["rumored", "announced", "sold_out"] as const) {
      expect(verifiedTicketOffer({ ...base, status }, NOW)).toBeNull();
    }
  });
  it("requires both event source check and ticket verification dates", () => {
    expect(verifiedTicketOffer({ ...base, source_checked_at: null }, NOW)).toBeNull();
    expect(verifiedTicketOffer({ ...base, ticket: null }, NOW)).toBeNull();
    expect(verifiedTicketOffer({ ...base, ticket: { ...base.ticket!, verified_at: "2026-10-20T00:00:00Z" } }, NOW)).toBeNull();
    expect(verifiedTicketOffer({ ...base, source_checked_at: "2026-10-20T00:00:00Z" }, NOW)).toBeNull();
    expect(recentTicketVerification("2026-11-06T00:00:00Z", NOW)).toBe(false);
  });
  it("formats date without a local timezone day shift", () => {
    expect(readableEventDate("2026-11-22")).toContain("22 nov");
  });
});
