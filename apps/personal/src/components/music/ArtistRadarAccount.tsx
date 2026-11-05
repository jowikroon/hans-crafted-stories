/** Signed-in, privacy-scoped Artist Radar. No payment or newsletter activation is implied. */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Bell, CheckCircle2, Clock3, Loader2, LogOut, Plus, Radar, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  addRadarFollow, CATEGORY_LABELS, DEFAULT_RADAR_PREFERENCES, listRadarActivity,
  listRadarFollows, listRadarStatusHistory, loadPublicRadarEvents, loadRadarPreferences,
  RADAR_CATEGORIES, RADAR_SUGGESTIONS, radarStatusLabel, removeRadarFollow,
  safeRadarArtist, saveRadarPreferences, validRadarEmail,
  type RadarActivity, type RadarArtist, type RadarCountry, type RadarFollow,
  type RadarPreferences, type RadarPublicEvent, type RadarStatusHistory,
} from "@/lib/artistRadarAccount";
import ArtistRadarTickets from "@/components/music/ArtistRadarTickets";

const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#C6FF34]/55 bg-[#C6FF34] px-4 py-2.5 text-sm font-semibold text-[#101307] transition hover:bg-[#E8FFA3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6FF34] disabled:cursor-not-allowed disabled:opacity-50";
const fieldClass = "min-h-11 w-full rounded-xl border border-white/20 bg-[#111613] px-3 py-2.5 text-sm text-[#F2F3EF] placeholder:text-white/45 focus:border-[#C6FF34] focus:outline-none focus:ring-2 focus:ring-[#C6FF34]/25";
const panelClass = "rounded-2xl border border-white/10 bg-[#121714] p-4 sm:p-5";

function shortDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Datum onbekend" : date.toLocaleString("nl-NL", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam",
  });
}

function activityLabel(row: RadarActivity): string {
  switch (row.kind) {
    case "followed": return `${row.artist_name ?? "Artiest"} toegevoegd`;
    case "unfollowed": return `${row.artist_name ?? "Artiest"} niet meer gevolgd`;
    case "preferences_updated": return "Rubrieken of regio's bijgewerkt";
    case "ticket_link_opened": return `Ticketlink geopend${row.artist_name ? ` voor ${row.artist_name}` : ""}${row.provider ? ` · ${row.provider}` : ""} (geen aankoopbewijs)`;
    default: return "Activiteit";
  }
}

function currentSignal(follow: RadarFollow, events: RadarPublicEvent[], countries: RadarCountry[]) {
  return events.filter((e) => e.artist_id === follow.artist_id && countries.includes(e.country))
    .sort((a, b) => a.sort_key - b.sort_key)[0] ?? null;
}

/** This panel deliberately works without the site owner/admin portal. */
export default function ArtistRadarAccount() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [magicPending, setMagicPending] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [follows, setFollows] = useState<RadarFollow[]>([]);
  const [prefs, setPrefs] = useState<RadarPreferences>({ countries: ["NL", "BE"], categories: [...RADAR_CATEGORIES] });
  const [activity, setActivity] = useState<RadarActivity[]>([]);
  const [statusHistory, setStatusHistory] = useState<RadarStatusHistory[]>([]);
  const [events, setEvents] = useState<RadarPublicEvent[]>([]);
  const [feedCheckedAt, setFeedCheckedAt] = useState("");
  const [feedError, setFeedError] = useState("");
  const [feedLoading, setFeedLoading] = useState(true);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [accountReady, setAccountReady] = useState(false);
  const [artistInput, setArtistInput] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [newsletterConsent, setNewsletterConsent] = useState(false);

  // A verified click-log write from the ticket panel refreshes account history;
  // the event itself is never mistaken for a payment or reservation.
  useEffect(() => {
    const onActivity = () => setRevision((current) => current + 1);
    window.addEventListener("artist-radar:activity", onActivity);
    return () => window.removeEventListener("artist-radar:activity", onActivity);
  }, []);

  // Public data is read-only. A failing or unverified source must never be shown
  // as a confirmed absence of events or as real-time ticket availability.
  useEffect(() => {
    const controller = new AbortController();
    loadPublicRadarEvents(controller.signal).then((feed) => {
      setEvents(feed.events);
      setFeedCheckedAt(feed.checkedAt);
      setFeedError("");
      setFeedLoading(false);
    }).catch((err) => {
      if (controller.signal.aborted) return;
      setFeedError(err instanceof Error ? err.message : "De openbare radarbron is niet beschikbaar.");
      setFeedLoading(false);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setFollows([]); setActivity([]); setStatusHistory([]); setAccountReady(false); setError("");
      return;
    }
    let active = true;
    setLoadingAccount(true); setAccountReady(false); setError("");
    Promise.all([listRadarFollows(user.id), loadRadarPreferences(user.id), listRadarActivity(user.id)])
      .then(async ([savedFollows, savedPrefs, savedActivity]) => {
        const savedHistory = await listRadarStatusHistory(savedFollows.map((f) => f.artist_id));
        if (!active) return;
        setFollows(savedFollows);
        setPrefs(savedPrefs);
        setActivity(savedActivity);
        setStatusHistory(savedHistory);
        setAccountReady(true);
      }).catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Je radaraccount is tijdelijk niet beschikbaar.");
      }).finally(() => { if (active) setLoadingAccount(false); });
    return () => { active = false; };
  }, [user?.id, revision]);

  const candidates = useMemo<RadarArtist[]>(() => {
    const fromEvents = events.map((e) => ({ id: e.artist_id, name: e.artist_name, genre: "Live" }));
    return [...RADAR_SUGGESTIONS, ...fromEvents].filter((a, i, all) => all.findIndex((x) => x.id === a.id) === i);
  }, [events]);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!validRadarEmail(normalized)) { setError("Voer een geldig e-mailadres in."); return; }
    setMagicPending(true); setError(""); setNotice("");
    // The callback uses a fixed, whitelisted radar destination. Do not accept
    // untrusted `next`/`redirect` URL parameters from the page.
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback?artist-radar=account`,
        },
      });
      if (authError) throw new Error("De inlogmail kon niet worden aangevraagd. Probeer het later opnieuw.");
      setMagicSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inloggen is tijdelijk niet beschikbaar.");
    } finally {
      setMagicPending(false);
    }
  }

  async function addArtist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.id || !accountReady || pendingAction) return;
    const artist = safeRadarArtist(artistInput, candidates);
    if (!artist) { setError("Vul minstens twee letters van een artiestnaam in."); return; }
    if (follows.some((f) => f.artist_id === artist.id)) { setNotice("Deze artiest staat al op je radar."); return; }
    setPendingAction("follow"); setError(""); setNotice("");
    try {
      await addRadarFollow(user.id, artist);
      setArtistInput("");
      setNotice(`${artist.name} toegevoegd. Concertstatus verschijnt alleen als er brongegevens beschikbaar zijn.`);
      setRevision((value) => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Artiest toevoegen is niet gelukt."); }
    finally { setPendingAction(""); }
  }

  async function unfollow(follow: RadarFollow) {
    if (!user?.id || !accountReady || pendingAction) return;
    setPendingAction(`unfollow:${follow.artist_id}`); setError(""); setNotice("");
    try {
      await removeRadarFollow(user.id, follow);
      setNotice(`${follow.artist_name} verwijderd uit je radar.`);
      setRevision((value) => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Verwijderen is niet gelukt."); }
    finally { setPendingAction(""); }
  }

  async function saveSettings() {
    if (!user?.id || !accountReady || pendingAction) return;
    setPendingAction("settings"); setError(""); setNotice("");
    try {
      await saveRadarPreferences(user.id, prefs);
      setNotice("Rubrieken en landen zijn opgeslagen voor je account. E-mailupdates staan hier los van.");
      setRevision((value) => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Voorkeuren zijn niet opgeslagen."); }
    finally { setPendingAction(""); }
  }

  async function requestNewsletter() {
    if (!user?.email || !newsletterConsent || !follows.length || pendingAction) return;
    setPendingAction("newsletter"); setError(""); setNotice("");
    try {
      const base = import.meta.env.VITE_SUPABASE_URL;
      if (!base) throw new Error("E-mailaanmelding is niet geconfigureerd.");
      // Separate legacy double opt-in endpoint: this NEVER activates a radar
      // account, and existing confirmed newsletter settings stay unchanged.
      const response = await fetch(`${base}/functions/v1/artist-radar-signup`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email, artists: follows.slice(0, 25).map((f) => ({ id: f.artist_id, name: f.artist_name, genre: f.genre })),
          countries: prefs.countries, source: "music/radar-account-explicit-newsletter", website: "",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true || result.mail_pending === true) {
        throw new Error("De bevestigingsmail is tijdelijk niet beschikbaar.");
      }
      setNotice("Als dit adres nog niet voor de weekmail bevestigd is, ontvang je een aparte bevestigingsmail. Bestaande nieuwsbriefvoorkeuren veranderen niet automatisch.");
      setNewsletterConsent(false);
    } catch (err) { setError(err instanceof Error ? err.message : "E-mailaanmelding is niet gelukt."); }
    finally { setPendingAction(""); }
  }

  function toggleCategory(category: (typeof RADAR_CATEGORIES)[number]) {
    setPrefs((prev) => ({ ...prev,
      categories: prev.categories.includes(category) ? prev.categories.filter((c) => c !== category) : [...prev.categories, category],
    }));
  }
  function toggleCountry(country: RadarCountry) {
    setPrefs((prev) => ({ ...prev,
      countries: prev.countries.includes(country) ? prev.countries.filter((c) => c !== country) : [...prev.countries, country],
    }));
  }

  return (
    <section aria-label="Mijn Artist Radar" className="space-y-5 text-[#F2F3EF]" style={{ fontFamily: "var(--font-display, sans-serif)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[#C6FF34]">Artist Radar · persoonlijk</p>
          <h3 className="text-2xl font-semibold sm:text-3xl">Mijn radar</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
            Volg je artiesten, kies je rubrieken en bekijk de laatst beschikbare concertsignalen. Je blijft op de muziekpagina.
          </p>
        </div>
        {user && (
          <button type="button" onClick={() => { void signOut().catch(() => setError("Uitloggen is niet gelukt.")); }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs text-white/75 hover:border-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C6FF34]">
            <LogOut size={15} aria-hidden="true" /> Uitloggen
          </button>
        )}
      </div>

      {authLoading ? <p role="status" className="flex items-center gap-2 text-sm text-white/70"><Loader2 className="animate-spin" size={17} /> Sessie controleren…</p> : null}
      {!authLoading && !user && (
        <div className={`${panelClass} max-w-xl`}>
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-1 shrink-0 text-[#C6FF34]" size={22} />
            <div>
              <h4 className="text-lg font-semibold">Bewaar je radar met je e-mailadres</h4>
              <p className="mt-1 text-sm leading-relaxed text-white/65">We sturen een veilige eenmalige inloglink. Bij je eerste aanmelding maken we een account. Geen wachtwoord nodig. Dit meldt je niet automatisch aan voor nieuwsbrieven.</p>
            </div>
          </div>
          <form onSubmit={sendMagicLink} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label htmlFor="radar-account-email" className="min-w-0 flex-1 text-xs text-white/70">
              E-mailadres
              <input id="radar-account-email" type="email" autoComplete="email" required maxLength={254}
                className={`${fieldClass} mt-1`} value={email} onChange={(event) => { setEmail(event.target.value); setMagicSent(false); }}
                placeholder="jij@voorbeeld.nl" />
            </label>
            <button type="submit" className={buttonClass} disabled={magicPending || !validRadarEmail(email.trim())}>
              {magicPending ? <Loader2 className="animate-spin" size={16} /> : <Radar size={16} />} Stuur inloglink
            </button>
          </form>
          {magicSent && <p role="status" className="mt-4 flex items-start gap-2 text-sm text-[#C6FF34]"><CheckCircle2 size={17} className="shrink-0" /> Als dit adres e-mail kan ontvangen, controleer je inbox om in te loggen. De link kan verlopen; vraag dan een nieuwe aan.</p>}
          <p className="mt-4 text-xs leading-relaxed text-white/55">Met je inloglink beheer je je eigen volglijst en voorkeuren. Een weekmail vraagt apart toestemming. Lees het <a href="/privacy" className="underline underline-offset-2 hover:text-[#C6FF34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C6FF34]">privacybeleid</a> voordat je een account aanmaakt.</p>
        </div>
      )}

      {!authLoading && user && (
        <>
          <p className="inline-flex items-center gap-2 text-xs text-white/60"><ShieldCheck size={14} className="text-[#C6FF34]" /> Ingelogde sessie · {user.email ?? "account"}</p>
          {loadingAccount && <p role="status" className="flex items-center gap-2 text-sm text-white/70"><Loader2 size={17} className="animate-spin" /> Je eigen radar laden…</p>}
          {accountReady && !loadingAccount && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className={panelClass}>
                  <div className="flex items-center justify-between gap-3"><h4 className="text-lg font-semibold">Artiesten die ik volg</h4><span className="font-mono text-xs text-[#C6FF34]">{follows.length} gevolgd</span></div>
                  <form onSubmit={addArtist} className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <label htmlFor="radar-artist-search" className="sr-only">Artiest toevoegen</label>
                    <input id="radar-artist-search" type="text" list="radar-artist-options" maxLength={100}
                      className={`${fieldClass} flex-1`} value={artistInput} onChange={(event) => setArtistInput(event.target.value)}
                      placeholder="Zoek of typ een artiest…" />
                    <datalist id="radar-artist-options">{candidates.map((artist) => <option key={artist.id} value={artist.name} />)}</datalist>
                    <button type="submit" className={buttonClass} disabled={!!pendingAction || !safeRadarArtist(artistInput, candidates)}><Plus size={16} /> Volgen</button>
                  </form>
                  <p className="mt-2 text-xs text-white/45">Zelf toegevoegde artiesten zijn toegestaan; een status verschijnt pas als de openbare bron die artiest herkent.</p>
                  {follows.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-white/15 p-5 text-sm text-white/60">Je volgt nog niemand. Voeg hierboven je eerste artiest toe.</p> : (
                    <ul className="mt-4 space-y-2" aria-label="Gevolgde artiesten">
                      {follows.map((follow) => {
                        const signal = currentSignal(follow, events, prefs.countries);
                        return <li key={follow.artist_id} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{follow.artist_name} <span className="ml-1 text-xs font-normal text-white/45">{follow.genre}</span></p>
                            <p className="mt-1 text-xs leading-relaxed text-white/60">
                              {feedLoading ? "Concertsignalen laden…" : feedError ? "Status niet beschikbaar: radarbron niet bereikbaar" : signal
                                ? `Eerstvolgende gemelde show: ${radarStatusLabel(signal.status)} · ${signal.city} · ${signal.event_date}`
                                : "Geen actuele show voor deze artiest in de openbare feed"}
                            </p>
                            {signal && !feedLoading && !feedError && <p className="mt-1 text-[11px] text-white/40">
                              {signal.source ? `Bron: ${signal.source} · ` : "Bron niet vermeld · "}
                              {signal.source_checked_at ? `Laatste broncontrole: ${shortDate(signal.source_checked_at)}` : "Broncontrole niet bekend"}
                            </p>}
                          </div>
                          <button type="button" onClick={() => { void unfollow(follow); }}
                            disabled={!!pendingAction} aria-label={`Stop met volgen van ${follow.artist_name}`}
                            className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C6FF34] disabled:opacity-40">
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </li>;
                      })}
                    </ul>
                  )}
                  <p className="mt-3 text-xs text-white/40">{feedError || (feedCheckedAt ? `Openbare feed opgevraagd: ${shortDate(feedCheckedAt)}. Beschikbaarheid kan wijzigen.` : "Openbare statusbron wordt geladen…")}</p>
                </div>

                <div className={panelClass}>
                  <h4 className="text-lg font-semibold">Mijn rubrieken</h4>
                  <p className="mt-1 text-xs text-white/60">Kies je rubrieken voor toekomstige meldingen. Je ziet de huidige concertstatus ook wanneer die buiten je gekozen meldingen valt.</p>
                  <fieldset className="mt-4 space-y-2">
                    <legend className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">Signaalsoorten</legend>
                    {RADAR_CATEGORIES.map((category) => (
                      <label key={category} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 py-1 text-sm hover:bg-white/5">
                        <input type="checkbox" checked={prefs.categories.includes(category)} onChange={() => toggleCategory(category)} className="h-4 w-4 accent-[#C6FF34]" />
                        {CATEGORY_LABELS[category]}
                      </label>
                    ))}
                  </fieldset>
                  <fieldset className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-4">
                    <legend className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">Landen</legend>
                    {(["NL", "BE"] as const).map((country) => <label key={country} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={prefs.countries.includes(country)} onChange={() => toggleCountry(country)} className="h-4 w-4 accent-[#C6FF34]" />{country === "NL" ? "Nederland" : "België"}</label>)}
                  </fieldset>
                  <button type="button" onClick={() => { void saveSettings(); }} disabled={!!pendingAction || prefs.categories.length === 0 || prefs.countries.length === 0} className={`${buttonClass} mt-5 w-full`}>Voorkeuren opslaan</button>
                  <p className="mt-2 text-xs text-white/45">Rubrieken in je account zijn geen automatische nieuwsbriefinschrijving.</p>
                </div>
              </div>

              <div className={panelClass}>
                <div className="flex items-start gap-3"><Bell size={20} className="shrink-0 text-[#C6FF34]" aria-hidden="true" /><div><h4 className="text-lg font-semibold">Wekelijkse e-mail · apart bevestigen</h4><p className="mt-1 text-sm text-white/60">Een account aanmaken stuurt geen wekelijkse mails. De bestaande mailinglijst gebruikt een aparte bevestigingsmail. Bestaande nieuwsbriefvoorkeuren zijn niet via dit account te wijzigen.</p></div></div>
                <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-white/75"><input type="checkbox" checked={newsletterConsent} onChange={(event) => setNewsletterConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#C6FF34]" />Ik wil een aparte aanmelding aanvragen voor maximaal één concertoverzicht per week.</label>
                <button type="button" onClick={() => { void requestNewsletter(); }} disabled={!newsletterConsent || !follows.length || !!pendingAction} className={`${buttonClass} mt-4`}>Bevestigingsmail aanvragen</button>
                {follows.length > 25 && <p className="mt-2 text-xs text-amber-200">De bestaande mailservice ondersteunt maximaal 25 artiesten; alleen de eerste 25 worden voor de aanvraag gebruikt.</p>}
              </div>

              <ArtistRadarTickets key={revision} />

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className={panelClass}>
                  <h4 className="flex items-center gap-2 text-lg font-semibold"><Clock3 size={18} className="text-[#C6FF34]" /> Accountgeschiedenis</h4>
                  {activity.length === 0 ? <p className="mt-3 text-sm text-white/55">Nog geen activiteiten opgeslagen.</p> : <ol className="mt-3 space-y-3">{activity.map((row) => <li key={row.id} className="border-l border-[#C6FF34]/30 pl-3"><p className="text-sm text-white/85">{activityLabel(row)}</p><p className="mt-1 text-xs text-white/45">{shortDate(row.created_at)}</p></li>)}</ol>}
                </div>
                <div className={panelClass}>
                  <h4 className="flex items-center gap-2 text-lg font-semibold"><Radar size={18} className="text-[#C6FF34]" /> Historie van signalen</h4>
                  {statusHistory.length === 0 ? <p className="mt-3 text-sm text-white/55">Er zijn nog geen geverifieerde statuswijzigingen voor je gevolgde artiesten opgeslagen. Oudere wijzigingen worden niet verzonnen.</p> : <ol className="mt-3 space-y-3">{statusHistory.map((entry) => <li key={entry.id} className="border-l border-[#C6FF34]/30 pl-3"><p className="text-sm text-white/85">{entry.artist_id}: {entry.old_status ? `${radarStatusLabel(entry.old_status)} → ` : ""}{radarStatusLabel(entry.new_status)}</p><p className="mt-1 text-xs text-white/45">{shortDate(entry.observed_at)} · bron: {entry.source}</p></li>)}</ol>}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {error && <p role="alert" className="rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}{user && !accountReady ? " Je accountgegevens zijn nog niet beschikbaar. Probeer het later opnieuw." : ""}</p>}
      {notice && <p role="status" className="rounded-xl border border-[#C6FF34]/30 bg-[#C6FF34]/5 px-4 py-3 text-sm text-[#DFFFA0]">{notice}</p>}
    </section>
  );
}
