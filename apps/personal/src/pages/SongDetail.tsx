import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ChevronRight } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { getSong, songs, type SongBlock } from "@/data/music";

const ease = [0.22, 1, 0.36, 1] as const;

const renderBlock = (b: SongBlock, i: number) => {
  switch (b.t) {
    case "lead":
      return <p key={i} className="text-xl leading-relaxed text-foreground" dangerouslySetInnerHTML={{ __html: b.text }} />;
    case "p":
      return <p key={i} className="text-[17px] leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: b.text }} />;
    case "h2":
      return <h2 key={i} id={b.id} className="mt-12 font-display text-2xl font-medium tracking-tight text-foreground" dangerouslySetInnerHTML={{ __html: b.text }} />;
    case "pull":
      return (
        <p key={i} className="my-10 border-l-[3px] border-primary pl-7 font-display text-2xl font-medium italic leading-snug text-foreground" dangerouslySetInnerHTML={{ __html: b.text }} />
      );
    case "callout":
      return (
        <div key={i} className="my-8 rounded-2xl border border-border bg-secondary/40 p-6">
          <div className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-primary">{b.k}</div>
          <p className="text-[15px] leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: b.text }} />
        </div>
      );
    default:
      return null;
  }
};

const SongDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const song = getSong(slug);

  useSEO({
    enabled: !!song,
    title: song ? `${song.title} — Song & Production Notes | Hans van Leeuwen` : "Track not found",
    description: song
      ? `Listen to ${song.title} by Hans van Leeuwen and read the full production notes: how the track was made, the gear and DAW used, plus the lyrics.`
      : "",
    url: `https://hansvanleeuwen.com/music/${slug ?? ""}`,
    type: "music.song",
    noindex: !song,
    jsonLd: song
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
                { "@type": "ListItem", position: 2, name: "Music", item: "https://hansvanleeuwen.com/music" },
                { "@type": "ListItem", position: 3, name: song.title, item: `https://hansvanleeuwen.com/music/${song.slug}` },
              ],
            },
            {
              "@type": "MusicRecording",
              name: song.title,
              byArtist: { "@type": "MusicGroup", name: "Hans van Leeuwen" },
              datePublished: song.date,
              genre: song.tag,
              url: `https://hansvanleeuwen.com/music/${song.slug}`,
            },
          ],
        }
      : undefined,
  });

  if (!song) return <Navigate to="/music" replace />;

  const others = songs.filter((s) => s.slug !== song.slug).slice(0, 2);

  return (
    <section className="section-container pt-28 pb-20">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
          <Home size={12} />
          <span>Home</span>
        </Link>
        <ChevronRight size={11} className="text-muted-foreground/40" />
        <Link to="/music" className="transition-colors hover:text-foreground">Music</Link>
        <ChevronRight size={11} className="text-muted-foreground/40" />
        <span className="font-medium text-foreground">{song.title}</span>
      </nav>

      {/* Head */}
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="grid items-center gap-8 md:grid-cols-[320px_1fr]"
      >
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border shadow-xl">
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary to-primary/40">
            <span className="text-lg font-bold text-white/95">{song.title}</span>
          </div>
          <img
            src={song.cover}
            alt={`Cover art — ${song.title}`}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            className="relative z-10 h-full w-full object-cover"
          />
        </div>
        <div>
          <div className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary">{song.catLine}</div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">{song.title}</h1>
          <p className="mt-3 text-[17px] text-muted-foreground">
            Written, produced &amp; mixed by <span className="font-semibold text-foreground">Hans van Leeuwen</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            {song.facts.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 border-r border-border pr-6 last:border-r-0 last:pr-0">
                <span className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">{k}</span>
                <span className="text-[15px] font-semibold text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.header>

      {/* Player */}
      <div className="mx-auto mt-10 max-w-5xl">
        <iframe
          title={`Spotify — ${song.title}`}
          src={song.embed}
          width="100%"
          height={152}
          frameBorder={0}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          style={{ border: 0, borderRadius: 14, display: "block" }}
        />
        <div className="mt-4 flex flex-wrap gap-2.5">
          <a href={song.spotify} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#1DB954" }} /> Spotify
          </a>
          <span className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground">Apple Music</span>
          <span className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground">YouTube</span>
          <span className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground">SoundCloud</span>
        </div>
      </div>

      {/* Body + aside */}
      <div className="mx-auto mt-14 grid max-w-5xl gap-12 md:grid-cols-[minmax(0,1fr)_300px]">
        <article className="space-y-6">{song.blocks.map(renderBlock)}</article>
        <aside className="space-y-5 md:sticky md:top-28 md:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="px-5 pb-3 pt-5 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">The session</div>
            <dl>
              {song.specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-t border-border/60 px-5 py-2.5 text-[13.5px]">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Gear &amp; instruments</div>
            <ul className="space-y-2.5">
              {song.gear.map((g, i) => (
                <li key={i} className="flex gap-3 text-[13.5px] leading-snug text-muted-foreground">
                  <span className="mt-1.5 h-[7px] w-[7px] flex-none rounded-sm bg-primary" />
                  <span dangerouslySetInnerHTML={{ __html: g }} />
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Lyrics */}
      <section className="mx-auto mt-16 max-w-5xl border-t border-border pt-11" aria-label="Lyrics">
        <div className="mb-6 font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Lyrics</div>
        <div className="gap-x-16 md:columns-2">
          {song.lyrics.map(([tag, body], i) => (
            <div key={i} className="mb-7 break-inside-avoid">
              <div className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-primary">{tag}</div>
              <p className="font-display text-lg font-medium leading-relaxed text-foreground" dangerouslySetInnerHTML={{ __html: body }} />
            </div>
          ))}
        </div>
      </section>

      {/* More tracks */}
      <section className="mx-auto mt-16 max-w-5xl border-t border-border pt-9">
        <div className="mb-5 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">More tracks</div>
        <div className="grid gap-4 sm:grid-cols-2">
          {others.map((o) => (
            <Link key={o.slug} to={`/music/${o.slug}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide text-primary">{o.tag}</span>
                <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/60" />
                <span>{o.dur}</span>
              </div>
              <div className="font-display text-lg font-medium tracking-tight text-foreground">{o.title}</div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
};

export default SongDetail;
