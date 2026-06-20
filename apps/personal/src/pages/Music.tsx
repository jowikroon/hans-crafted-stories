import { motion } from "framer-motion";
import { Home, ChevronRight, Music as MusicIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import { useSEO } from "@/hooks/useSEO";

// Spotify embed for the "Beat Drop" project.
// To swap: open the artist/album/track on Spotify → Share → Embed, and paste the
// src URL here (format: https://open.spotify.com/embed/<type>/<id>?utm_source=generator).
const SPOTIFY_EMBED_SRC =
  "https://open.spotify.com/embed/artist/4gzpq5DPGxSnKTe4SA8HAU?utm_source=generator";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const Music = () => {
  const { lang } = useLang();
  const t = translations[lang].music;

  useSEO({
    title: lang === "nl" ? "Muziek — Hans van Leeuwen" : "Music — Hans van Leeuwen",
    description: t.intro,
    url: "https://hansvanleeuwen.com/music",
    hreflang: [
      { lang: "en", href: "https://hansvanleeuwen.com/music" },
      { lang: "nl", href: "https://hansvanleeuwen.com/music" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/music" },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": "https://hansvanleeuwen.com/music#page",
          name: t.heading,
          description: t.intro,
          url: "https://hansvanleeuwen.com/music",
          isPartOf: { "@id": "https://hansvanleeuwen.com/#website" },
          about: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person" },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
            { "@type": "ListItem", position: 2, name: t.label, item: "https://hansvanleeuwen.com/music" },
          ],
        },
      ],
    },
  });

  return (
    <section className="section-container pt-28 pb-20">
      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex items-center gap-1.5 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
          <Home size={12} />
          <span>Home</span>
        </Link>
        <ChevronRight size={11} className="text-muted-foreground/40" />
        <span className="font-medium text-foreground">{t.label}</span>
      </motion.nav>

      {/* Header */}
      <motion.div {...fadeIn}>
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">{t.label}</p>
        <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
          {t.heading}
        </h1>
        <p className="mb-10 max-w-xl text-base leading-relaxed text-muted-foreground">{t.subtitle}</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Intro text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-prose text-base leading-relaxed text-muted-foreground"
        >
          <p>{t.intro}</p>
        </motion.div>

        {/* Spotify player */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <MusicIcon size={15} className="text-primary" />
            <span>{t.listenLabel}</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-foreground/[0.04]">
            <iframe
              title="Beat Drop on Spotify"
              src={SPOTIFY_EMBED_SRC}
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Music;
