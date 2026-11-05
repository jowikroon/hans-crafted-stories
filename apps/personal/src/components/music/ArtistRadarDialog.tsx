import { useEffect, useMemo, useState, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import ArtistRadarVisual from "@/components/music/ArtistRadarVisual";
import ArtistRadarAccount from "@/components/music/ArtistRadarAccount";
import { RADAR_ARTISTS, searchRadarArtists, type RadarArtist } from "@/lib/artistRadarCatalog";
import { verifiedTicketOffer, type RadarTicketEvent } from "@/lib/artistRadarTickets";
import { supabase } from "@/integrations/supabase/client";
import "@/styles/artist-radar-dialog.css";

// Preview builds currently inherit the production Supabase URL. Keep all
// account actions unavailable until an isolated staging backend is verified.
// The public, read-only discovery radar remains useful without registration.
const accountEnabled = import.meta.env.VITE_ARTIST_RADAR_ACCOUNTS_ENABLED === "true";

export type ArtistRadarTab = "account" | "discover";

interface ArtistRadarDialogProps {
  open: boolean;
  onClose: () => void;
  initialTab?: ArtistRadarTab;
  returnFocusTo?: RefObject<HTMLElement | null>;
}

type SignalStatus = "rumored" | "announced" | "available" | "sold_out";

interface PublicRadarEvent {
  event_key?: string;
  artist_id: string;
  artist_name: string;
  venue: string | null;
  city: string | null;
  country: string;
  event_date: string;
  sort_key: number;
  status: SignalStatus;
  urgent: boolean;
  source?: string | null;
  source_checked_at?: string | null;
  ticket?: { url: string; seller: string; verified_at: string } | null;
}

interface PublicRadarFeed {
  ok: boolean;
  events?: PublicRadarEvent[];
  checked_at?: string;
}

const SIGNAL_LABELS: Record<SignalStatus, string> = {
  rumored: "Gerucht",
  announced: "Aangekondigd",
  available: "Verkoop gemeld",
  sold_out: "Uitverkocht",
};

function isPublicRadarEvent(item: unknown): item is PublicRadarEvent {
  if (!item || typeof item !== "object") return false;
  const value = item as Partial<PublicRadarEvent>;
  return typeof value.artist_id === "string" &&
    typeof value.artist_name === "string" &&
    typeof value.event_date === "string" &&
    typeof value.sort_key === "number" && Number.isFinite(value.sort_key) &&
    typeof value.status === "string" &&
    Object.prototype.hasOwnProperty.call(SIGNAL_LABELS, value.status) &&
    (value.country === "NL" || value.country === "BE");
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Niet bevestigd";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Niet bevestigd" : new Intl.DateTimeFormat("nl-NL", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam",
  }).format(date);
}

function sourceAgeLabel(value: string | null | undefined): string {
  if (!value) return "Broncontrole onbekend";
  const checked = new Date(value).getTime();
  if (!Number.isFinite(checked) || checked > Date.now()) return "Broncontrole onbekend";
  const days = Math.floor((Date.now() - checked) / 86400000);
  return days < 1 ? "Bron gecontroleerd vandaag" : `Bron gecontroleerd ${days} ${days === 1 ? "dag" : "dagen"} geleden`;
}

function eventTicketOffer(event: PublicRadarEvent): { url: string; seller: string } | null {
  // The public function already strips unverified links. Recheck host and both
  // verification timestamps on the client so a future feed mistake fails shut.
  const ticketEvent: RadarTicketEvent = {
    ...event,
    venue: event.venue ?? "",
    city: event.city ?? "",
    country: event.country as "NL" | "BE",
    source_checked_at: event.source_checked_at ?? null,
    ticket: event.ticket ?? null,
  };
  return verifiedTicketOffer(ticketEvent);
}

/** Anonymous exploration; saving favorites and history requires the account tab. */
function RadarDiscovery({ onOpenAccount }: { onOpenAccount: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RadarArtist | null>(null);
  const [events, setEvents] = useState<PublicRadarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      try {
        const { data, error } = await supabase.functions.invoke<PublicRadarFeed>("artist-radar-public-events", {
          method: "GET", signal: controller.signal,
        });
        if (cancelled) return;
        if (error || !data?.ok || !Array.isArray(data.events)) throw new Error("Radargegevens niet beschikbaar");
        setEvents(data.events.filter(isPublicRadarEvent));
      } catch {
        if (!cancelled) setFeedError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; controller.abort(); };
  }, []);

  const artists = useMemo(() => {
    const known = new Set(RADAR_ARTISTS.map((artist) => artist.id));
    const fromFeed: RadarArtist[] = [];
    for (const event of events) {
      if (!known.has(event.artist_id)) {
        fromFeed.push({ id: event.artist_id, name: event.artist_name, genre: "Live" });
        known.add(event.artist_id);
      }
    }
    return [...RADAR_ARTISTS, ...fromFeed];
  }, [events]);
  const suggestions = useMemo(() => searchRadarArtists(query, artists, 8), [query, artists]);
  const activeArtists = useMemo(() => {
    const ids = new Set<string>();
    return events.filter((event) => {
      if (ids.has(event.artist_id)) return false;
      ids.add(event.artist_id);
      return true;
    }).slice(0, 4);
  }, [events]);
  const signals = useMemo(() => {
    const matching = selected ? events.filter((event) => event.artist_id === selected.id) : events;
    return matching.slice().sort((a, b) => a.sort_key - b.sort_key).slice(0, 4);
  }, [events, selected]);

  return (
    <div className="ard-discover">
      <label htmlFor="ard-artist-search" className="ard-discover__lead">Welke artiest wil je niet missen?</label>
      <input
        id="ard-artist-search"
        type="search"
        className="ard-discover__search"
        placeholder="Zoek op artiest of genre"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <p className="ard-discover__assist">Verken zonder account. Inloggen is alleen nodig om je persoonlijke radar op te slaan.</p>

      <div className="ard-artist-list" aria-label="Beschikbare artiesten">
        {suggestions.map((artist) => (
          <button
            type="button"
            key={artist.id}
            className="ard-artist"
            aria-pressed={selected?.id === artist.id}
            onClick={() => setSelected((current) => current?.id === artist.id ? null : artist)}
          >
            <span>{artist.name}</span><small>{artist.genre}</small>
          </button>
        ))}
        {suggestions.length === 0 && <p className="ard-discover__empty">Geen artiest gevonden in de beschikbare lijst.</p>}
      </div>

      {activeArtists.length > 0 && !selected && (
        <div className="ard-discover__recent">
          <span>Met een toekomstig signaal</span>
          <div className="ard-discover__recent-list">
            {activeArtists.map((event) => (
              <button type="button" key={event.artist_id} onClick={() => setSelected({ id: event.artist_id, name: event.artist_name, genre: "Live" })}>{event.artist_name}</button>
            ))}
          </div>
        </div>
      )}

      <section className="ard-signals" aria-label="Concertsignalen">
        <div className="ard-signals__heading">
          <h3>{selected ? `Signalen voor ${selected.name}` : "Komende concertsignalen"}</h3>
          {selected && <button type="button" onClick={() => setSelected(null)} aria-label="Wis artiestfilter">Wis filter</button>}
        </div>
        {loading && <p role="status" className="ard-signals__note">Openbare concertsignalen ophalen…</p>}
        {feedError && <p role="status" className="ard-signals__warning">De publieke concertfeed is tijdelijk niet beschikbaar. Je kunt artiesten blijven zoeken, maar actuele statussen kunnen niet worden getoond.</p>}
        {!loading && !feedError && signals.length === 0 && <p role="status" className="ard-signals__note">Voor deze selectie zijn geen toekomstige concertmeldingen in de publieke bron beschikbaar. Dit betekent niet dat er geen concerten zijn.</p>}
        {!loading && !feedError && signals.map((event) => {
          const ticketOffer = eventTicketOffer(event);
          return (
            <article className="ard-signal" key={event.event_key || [event.artist_id, event.country, event.city, event.venue, event.sort_key].join("|")}>
              <div className="ard-signal__top">
                <strong>{event.artist_name}</strong>
                <span className={`ard-signal__status ard-signal__status--${event.status}`}>{SIGNAL_LABELS[event.status]}</span>
              </div>
              <p>{formatDate(event.event_date)} · {[event.venue, event.city, event.country].filter(Boolean).join(" · ")}</p>
              <small>{sourceAgeLabel(event.source_checked_at)}{event.source ? ` · ${event.source}` : ""}</small>
              {ticketOffer && <a className="ard-signal__tickets" href={ticketOffer.url} target="_blank" rel="noopener noreferrer">Tickets bij {ticketOffer.seller} <span aria-hidden="true">↗</span></a>}
            </article>
          );
        })}
      </section>

      <div className="ard-discover__action">
        <button type="button" className="ard-discover__cta" onClick={onOpenAccount}>{accountEnabled ? "Maak mijn radar aan" : "Mijn radar (binnenkort)"} <span aria-hidden="true">↗</span></button>
        <p className="ard-discover__note">{accountEnabled
          ? "In je account kies je opnieuw welke artiesten je wilt bewaren; verkennen slaat niets op. Daar vind je ook historie, rubrieken en officiële ticketlinks. Betalen doe je bij de verkoper. Geruchten zijn geen bevestigde shows."
          : "Je kunt nu al ontdekken. Het bewaren van artiesten, rubrieken en historie en het openen van gecontroleerde verkooplinks vanuit je account volgen na de veiligheidstests. Geruchten zijn geen bevestigde shows."}</p>
      </div>
    </div>
  );
}

/**
 * Artist Radar's on-page experience. Keep the account inside the existing music
 * context: the standalone radar routes have their own SEO, page scroll and
 * imperative DOM scripts and must not be mounted as a modal body.
 */
export default function ArtistRadarDialog({
  open,
  onClose,
  initialTab = "account",
  returnFocusTo,
}: ArtistRadarDialogProps) {
  const [tab, setTab] = useState<ArtistRadarTab>(initialTab);
  const [accountVisited, setAccountVisited] = useState(initialTab === "account");

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setAccountVisited(initialTab === "account");
    }
  }, [initialTab, open]);

  const changeTab = (next: ArtistRadarTab) => {
    setTab(next);
    if (next === "account") setAccountVisited(true);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="ard-overlay" />
        <Dialog.Content
          className="ard-dialog"
          onCloseAutoFocus={(event) => {
            if (returnFocusTo?.current?.isConnected) {
              event.preventDefault();
              returnFocusTo.current.focus({ preventScroll: true });
            }
          }}
        >
          <header className="ard-header">
            <span className="ard-header__eyebrow"><span className="ard-header__led" aria-hidden="true" />Jowikroon <span className="ard-header__divider">/</span> Artist Radar</span>
            <Dialog.Close className="ard-close" aria-label="Sluit Artist Radar" title="Sluiten">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </Dialog.Close>
          </header>

          <div className="ard-body">
            <aside className="ard-stage" aria-hidden="true">
              <div className="ard-stage__ring"><ArtistRadarVisual active={open} /></div>
              <p className="ard-stage__caption">YOUR SIGNAL / NL + BE</p>
              <p className="ard-stage__hint">Een signaal voor wat je niet wilt missen. Jij bepaalt wie je volgt.</p>
            </aside>

            <div className="ard-main">
              <div className="ard-intro">
                <p className="ard-kicker">Jouw eigen muziekradar</p>
                <Dialog.Title className="ard-title">Mis het moment niet.</Dialog.Title>
                <Dialog.Description className="ard-description">
                  Bekijk de laatst beschikbare concertsignalen, stel je eigen radar in en open geverifieerde ticketlinks zonder deze muziekpagina te verlaten.
                </Dialog.Description>
              </div>

              <Tabs.Root className="ard-tabs" value={tab} onValueChange={(next) => changeTab(next as ArtistRadarTab)}>
                <Tabs.List className="ard-tabs__list" aria-label="Artist Radar-weergave">
                  <Tabs.Trigger className="ard-tabs__trigger" value="account">Mijn radar</Tabs.Trigger>
                  <Tabs.Trigger className="ard-tabs__trigger" value="discover">Ontdek</Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content className="ard-tabs__content" value="account" forceMount hidden={tab !== "account"}>
                  {accountVisited && <div className="ard-account" hidden={tab !== "account"}>
                    {accountEnabled ? <ArtistRadarAccount /> : (
                      <div className="ard-account__disabled" role="status">
                        <h3>Je persoonlijke radar is in voorbereiding</h3>
                        <p>Artiesten ontdekken en actuele bronmeldingen bekijken kan al. Het aanmaken van een account, bewaren van voorkeuren en bestellen van tickets wordt pas vrijgegeven na een veilige proef met e-mail, sessies en gegevensbescherming.</p>
                        <a href="/privacy">Zo gaan we met je gegevens om</a>
                      </div>
                    )}
                  </div>}
                </Tabs.Content>

                <Tabs.Content className="ard-tabs__content" value="discover">
                  <RadarDiscovery onOpenAccount={() => changeTab("account")} />
                </Tabs.Content>
              </Tabs.Root>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
