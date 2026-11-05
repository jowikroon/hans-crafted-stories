import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  listRadarFollows, loadPublicRadarEvents, recordRadarTicketLinkOpen,
} from "@/lib/artistRadarAccount";
import {
  RADAR_TICKET_STATUS, readableEventDate, readableSourceCheck, verifiedTicketOffer,
  type RadarTicketEvent,
} from "@/lib/artistRadarTickets";

type StatusFilter = "all" | RadarTicketEvent["status"];
type FollowsState =
  | { kind: "loading" }
  | { kind: "anonymous" }
  | { kind: "ready"; ids: Set<string> }
  | { kind: "error" };

const STATUS_CLASSES: Record<RadarTicketEvent["status"], string> = {
  available: "border-lime-400/30 bg-lime-400/10 text-lime-200",
  announced: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  rumored: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  sold_out: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

/**
 * Purchase is intentionally completed by the official seller. This view never
 * takes payment, invents an order, or calls an opened link a purchased ticket.
 */
export default function ArtistRadarTickets() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [events, setEvents] = useState<RadarTicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [follows, setFollows] = useState<FollowsState>({ kind: "loading" });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    loadPublicRadarEvents(controller.signal)
      .then((feed) => { if (!controller.signal.aborted) { setEvents(feed.events); setError(null); } })
      .catch(() => { if (!controller.signal.aborted) setError("De openbare concertinformatie is tijdelijk niet bereikbaar."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let active = true;
    if (authLoading) { setFollows({ kind: "loading" }); return; }
    if (!userId) { setFollows({ kind: "anonymous" }); return; }
    setFollows({ kind: "loading" });
    listRadarFollows(userId)
      .then((rows) => { if (active) setFollows({ kind: "ready", ids: new Set(rows.map((row) => row.artist_id)) }); })
      .catch(() => { if (active) setFollows({ kind: "error" }); });
    return () => { active = false; };
  }, [userId, authLoading]);

  const relevant = useMemo(() => {
    // An empty follow list deliberately shows discovery. An error is different
    // from an empty account and is disclosed to the user below.
    const followed = follows.kind === "ready" && follows.ids.size > 0;
    return events
      .filter((event) => !followed || follows.ids.has(event.artist_id))
      .filter((event) => statusFilter === "all" || event.status === statusFilter)
      .sort((a, b) => a.sort_key - b.sort_key || a.artist_name.localeCompare(b.artist_name, "nl"));
  }, [events, follows, statusFilter]);
  const visible = showAll ? relevant : relevant.slice(0, 12);
  const showingDiscovery = follows.kind !== "ready" || follows.ids.size === 0;

  return (
    <section aria-labelledby="artist-radar-tickets-heading" className="space-y-4 text-[#F2F3EF]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.23em] text-[#C6FF34]/75">Concertsignalen / NL + BE</p>
          <h3 id="artist-radar-tickets-heading" className="mt-1 text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Tickets en concertsignalen
          </h3>
          <p className="mt-1 max-w-[52ch] text-xs leading-relaxed text-[#AEB2B0]">
            Alleen bij een recent geverifieerde verkooplink kun je tickets bij de officiële aanbieder bekijken. Een klik is geen aankoopbevestiging.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-[11px] text-[#AEB2B0]">
          Verkoopstatus
          <select
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value as StatusFilter); setShowAll(false); }}
            className="min-h-11 rounded-lg border border-white/15 bg-[#14181A] px-3 py-2 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF34]"
          >
            <option value="all">Alle signalen</option>
            <option value="available">Verkoop gemeld</option>
            <option value="announced">Aangekondigd</option>
            <option value="rumored">Gerucht</option>
            <option value="sold_out">Uitverkocht</option>
          </select>
        </label>
      </div>

      {follows.kind === "ready" && follows.ids.size > 0 && (
        <p className="rounded-lg border border-[#C6FF34]/15 bg-[#C6FF34]/[0.04] p-3 text-xs text-[#CFD6D2]">
          Je ziet concerten van je {follows.ids.size} gevolgde artiest{follows.ids.size === 1 ? "" : "en"}.
        </p>
      )}
      {showingDiscovery && !loading && (
        <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-[#AEB2B0]">
          {follows.kind === "error"
            ? "Je gevolgde artiesten konden niet worden geladen. Hieronder staan openbare concertsignalen."
            : "Dit is de openbare concertagenda. Volg artiesten om hier je persoonlijke selectie te zien."}
        </p>
      )}

      {loading && <p role="status" className="py-4 text-sm text-[#AEB2B0]">Concertsignalen laden…</p>}
      {error && <p role="alert" className="rounded-lg border border-amber-400/25 bg-amber-400/[0.07] p-3 text-sm text-amber-100">{error}</p>}
      {!loading && !error && relevant.length === 0 && (
        <p role="status" className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-[#AEB2B0]">
          Geen actuele concerten voor deze selectie. Dat betekent niet dat er definitief geen concerten gepland zijn.
        </p>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visible.map((event, index) => {
            const ticket = verifiedTicketOffer(event);
            const status = RADAR_TICKET_STATUS[event.status];
            return (
              <article key={event.event_key ?? `${event.artist_id}:${event.sort_key}:${event.venue}:${index}`} className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border border-white/10 bg-[#111516] p-4">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <time dateTime={event.event_date} className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#C6FF34]">
                      {readableEventDate(event.event_date)}
                    </time>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${STATUS_CLASSES[event.status]}`}>
                      {status.label}
                    </span>
                  </div>
                  <h4 className="mt-2 text-base font-semibold leading-tight text-white">{event.artist_name}</h4>
                  <p className="mt-1 text-xs text-[#B5BBB7]">{[event.venue, event.city, event.country].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] leading-relaxed text-[#8F9993]">
                    {event.source ? `Bron: ${event.source} · ` : "Bron niet vermeld · "}{readableSourceCheck(event.source_checked_at)}
                  </p>
                  {ticket ? (
                    <a
                      href={ticket.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (user && event.event_key) {
                          // A click log is optional and must never block checkout.
                          void recordRadarTicketLinkOpen(user.id, event.artist_id, event.artist_name, event.event_key, ticket.seller).catch(() => undefined);
                        }
                      }}
                      aria-label={`Tickets kopen voor ${event.artist_name} bij ${ticket.seller}, opent in nieuw tabblad`}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#C6FF34] px-3 py-2.5 text-xs font-bold text-[#10140C] transition hover:bg-[#E1FFA1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6FF34]"
                    >
                      Tickets kopen bij {ticket.seller}<span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span aria-disabled="true" className="flex min-h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5 text-center text-xs text-[#A2ACA4]">
                      {status.noLink}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && relevant.length > 12 && (
        <button type="button" onClick={() => setShowAll((current) => !current)} className="min-h-11 rounded-lg border border-white/15 px-4 py-2 text-xs text-white hover:border-[#C6FF34]/60 focus-visible:ring-2 focus-visible:ring-[#C6FF34]">
          {showAll ? "Toon minder" : `Toon alle ${relevant.length} signalen`}
        </button>
      )}
      <p className="text-[11px] leading-relaxed text-[#84928A]">
        Kaartverkoop kan wijzigen. De officiële verkoper bevestigt de actuele beschikbaarheid, prijs en betaling. Je aankoophistorie blijft bij die verkoper totdat er een geautoriseerde orderkoppeling bestaat.
      </p>
    </section>
  );
}
