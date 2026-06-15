import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ChevronRight, Play, Pause } from "lucide-react";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { songs, release, genres, type Song } from "@/data/music";

type SortOrder = "newest" | "oldest";

const ease = [0.22, 1, 0.36, 1] as const;

const SongCard = ({ song, index }: { song: Song; index: number }) => {
  const [playing, setPlaying] = useState(false);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, delay: Math.min(index, 5) * 0.06, ease }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xl"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-secondary/40">
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary to-primary/40 text-center">
          <span className="px-2 text-sm font-bold text-white/95">{song.title}</span>
        </div>
        <img
          src={song.cover}
          alt={`Cover art — ${song.title}`}
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          className="relative z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute inset-0 z-20 bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <button
          type="button"
          aria-label={playing ? `Pause ${song.title}` : `Play ${song.title}`}
          aria-pressed={playing}
          onClick={() => setPlaying((p) => !p)}
          className="absolute bottom-4 right-4 z-30 grid h-14 w-14 translate-y-2 place-items-center rounded-full bg-primary text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-primary/90 active:scale-95"
        >
          {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>
      <div className="flex flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{song.dateLabel}</span>
          <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/60" />
          <span className="font-semibold uppercase tracking-wide text-primary">{song.tag}</span>
          <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/60" />
          <span className="font-mono">{song.dur}</span>
        </div>
        <Link
          to={`/music/${song.slug}`}
          className="font-display text-xl font-medium tracking-tight text-foreground transition-colors hover:text-primary"
        >
          {song.title}
        </Link>
        {playing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3, ease }}
            className="mt-4 overflow-hidden rounded-xl"
          >
            <iframe
              title={`Spotify — ${song.title}`}
              src={song.embed}
              width="100%"
              height={152}
              frameBorder={0}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              style={{ border: 0, borderRadius: 12, display: "block" }}
            />
          </motion.div>
        )}
      </div>
    </motion.article>
  );
};

const Music = () => {
  const { lang } = useLang();
  const [activeTag, setActiveTag] = useState("all");
  const [sort, setSort] = useState<SortOrder>("newest");

  const lede =
    lang === "nl"
      ? "Nummers die ik maak als ik wegstap van de spreadsheets. Bij elke track de volledige productiestory — hoe het begon, de gear, de fouten en de lyrics. Druk hieronder op play, of open een track voor de notities."
      : "Songs I make when I step away from the spreadsheets. Each one comes with the full production story — how it started, the gear, the mistakes, and the lyrics. Press play below, or open a track to read the notes.";

  useSEO({
    title: lang === "nl" ? "Music — Songs & Productienotities | Hans van Leeuwen" : "Music — Songs & Production Notes | Hans van Leeuwen",
    description:
      lang === "nl"
        ? "Eigen nummers van Hans van Leeuwen — luister op Spotify en lees de productienotities bij elke track: hoe het gemaakt is, de gear en de lyrics."
        : "Original songs by Hans van Leeuwen — listen on Spotify and read the production notes behind each track: how it was made, the gear, and the lyrics.",
    url: "https://hansvanleeuwen.com/music",
    type: "music.playlist",
    hreflang: [
      { lang: "en", href: "https://hansvanleeuwen.com/music" },
      { lang: "nl", href: "https://hansvanleeuwen.com/music" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/music" },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
            { "@type": "ListItem", position: 2, name: "Music", item: "https://hansvanleeuwen.com/music" },
          ],
        },
        {
          "@type": "MusicGroup",
          name: "Hans van Leeuwen",
          url: "https://hansvanleeuwen.com/music",
          genre: ["Lo-fi", "Electronic", "Ambient"],
        },
      ],
    },
  });

  const filtered = useMemo(() => {
    let list = activeTag === "all" ? songs : songs.filter((s) => s.tags.includes(activeTag));
    list = [...list].sort((a, b) =>
      sort === "newest" ? (a.date < b.date ? 1 : -1) : a.date < b.date ? -1 : 1
    );
    return list;
  }, [activeTag, sort]);

  return (
    <section className="section-container pt-28 pb-20">
      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="mb-8 flex items-center gap-1.5 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
          <Home size={12} />
          <span>Home</span>
        </Link>
        <ChevronRight size={11} className="text-muted-foreground/40" />
        <span className="font-medium text-foreground">Music</span>
      </motion.nav>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">Sound · Studio notes</p>
        <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">Music</h1>
        <p className="mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground">{lede}</p>
      </motion.div>

      {/* Featured release */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1, ease }}
        className="mb-8 grid items-stretch gap-0 overflow-hidden rounded-2xl border border-white/10 bg-[#17150F] md:grid-cols-[1.04fr_1fr]"
        aria-label="Latest release"
      >
        <div className="flex flex-col justify-center p-7 text-[#F6F4EE] md:p-10">
          <span className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.16em] text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {release.kicker}
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">{release.title}</h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#9E9A8E]">{release.sub}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {release.chips.map((c) => (
              <span key={c} className="rounded-full border border-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-[#F6F4EE]">
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="flex min-h-[300px] items-center justify-center bg-[#211E17] p-5 md:min-h-[352px]">
          <iframe
            title={`Spotify — ${release.title}`}
            src={release.embed}
            width="100%"
            height={release.height}
            frameBorder={0}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            style={{ border: 0, borderRadius: 14 }}
          />
        </div>
      </motion.section>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by genre">
          {genres.map((g) => (
            <button
              key={g.tag}
              onClick={() => setActiveTag(g.tag)}
              aria-pressed={activeTag === g.tag}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                activeTag === g.tag
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border text-muted-foreground hover:-translate-y-0.5 hover:border-foreground hover:text-foreground"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "track" : "tracks"}
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            aria-label="Sort"
            className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* Song grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((song, i) => (
            <SongCard key={song.slug} song={song} index={i} />
          ))}
        </AnimatePresence>
      </div>
      {filtered.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">No tracks in that genre yet.</p>
      )}
    </section>
  );
};

export default Music;
