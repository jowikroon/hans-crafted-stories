/** Ticket CTA policy is intentionally duplicated client-side for defence in depth.
 * The public Edge Function is authoritative and never returns unverified links.
 * None of these records represents an actual purchase or confirmed inventory.
 */
import type { RadarPublicEvent } from "@/lib/artistRadarAccount";

export type RadarTicketEvent = RadarPublicEvent & {
  event_key?: string;
  source?: string | null;
  source_checked_at?: string | null;
  ticket?: { url: string; seller: string; verified_at: string } | null;
};

export const TICKET_VERIFICATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const SELLER_HOSTS: Readonly<Record<string, string>> = {
  "ticketmaster.nl": "Ticketmaster",
  "ticketmaster.be": "Ticketmaster",
  "ticketmaster.com": "Ticketmaster",
  "eventim.nl": "Eventim",
  "eventim.be": "Eventim",
  "livenation.nl": "Live Nation",
  "livenation.be": "Live Nation",
  "ziggodome.nl": "Ziggo Dome",
  "afaslive.nl": "AFAS Live",
  "tivolivredenburg.nl": "TivoliVredenburg",
  "paradiso.nl": "Paradiso",
  "melkweg.nl": "Melkweg",
  "013.nl": "013",
  "abconcerts.be": "Ancienne Belgique",
};

export function recentTicketVerification(value: string | null | undefined, now = Date.now()): boolean {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= TICKET_VERIFICATION_MAX_AGE_MS;
}

/** Never use a seller name or link directly from arbitrary feed text. */
export function trustedTicketSeller(url: string): { url: string; seller: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || (parsed.port && parsed.port !== "443")) return null;
    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    for (const [domain, seller] of Object.entries(SELLER_HOSTS)) {
      if (host === domain || host.endsWith(`.${domain}`)) return { url: parsed.toString(), seller };
    }
  } catch {
    return null;
  }
  return null;
}

export function verifiedTicketOffer(event: RadarTicketEvent, now = Date.now()): { url: string; seller: string } | null {
  if (event.status !== "available" || !event.ticket ||
      !recentTicketVerification(event.ticket.verified_at, now) ||
      !recentTicketVerification(event.source_checked_at, now)) return null;
  return trustedTicketSeller(event.ticket.url);
}

export const RADAR_TICKET_STATUS: Record<RadarPublicEvent["status"], { label: string; noLink: string }> = {
  available: { label: "Verkoop gemeld", noLink: "Verkooplink wordt gecontroleerd" },
  announced: { label: "Aangekondigd", noLink: "Verkoop volgt" },
  rumored: { label: "Gerucht", noLink: "Nog niet bevestigd" },
  sold_out: { label: "Uitverkocht", noLink: "Uitverkocht" },
};

export function readableEventDate(eventDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return eventDate;
  const date = new Date(`${eventDate}T12:00:00Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" }).format(date)
    : eventDate;
}

export function readableSourceCheck(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "Nog niet bron-gecontroleerd";
  return `Bron gecontroleerd ${new Intl.DateTimeFormat("nl-NL", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value))}`;
}
