import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, BarChart3, Search, Zap } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";

const icons = [
  <ShoppingCart size={20} />,
  <BarChart3 size={20} />,
  <Search size={20} />,
  <Zap size={20} />,
];

const Hero = () => {
  const { lang } = useLang();
  const t = translations[lang].hero;

  return (
    <main>
      {/* Hero Section */}
      <section
        className="section-container flex min-h-[85vh] flex-col justify-center pt-28"
        aria-label="Introduction"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.subtitle}
          </p>
          <h1 className="mb-6 font-display text-4xl font-medium leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            {t.heading}{" "}
            <em className="text-primary">{t.headingEmphasis}</em> &amp; design.
          </h1>
          <p className="mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t.description}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/work"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-all duration-300 hover:gap-3 hover:shadow-lg"
              aria-label={t.ctaWork}
            >
              {t.ctaWork}
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-full border-2 border-border px-6 py-3 text-sm font-bold text-foreground transition-all duration-300 hover:border-foreground/40 hover:bg-secondary hover:shadow-sm"
              aria-label={t.ctaAbout}
            >
              {t.ctaAbout}
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Expertise Section */}
      <section
        className="section-container pb-20"
        aria-label={t.expertiseLabel}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.expertiseLabel}
          </h2>
          <p className="mb-8 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t.expertiseHeading}
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.expertise.map((item, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group rounded-xl border-2 border-border/40 bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                {icons[i]}
              </div>
              <h3 className="mb-1.5 text-sm font-bold text-foreground">
                {item.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <Link to="/work" className="font-semibold transition-colors hover:text-foreground">
            {t.linkCases}
          </Link>
          <Link to="/writing" className="font-semibold transition-colors hover:text-foreground">
            {t.linkWriting}
          </Link>
          <Link to="/about" className="font-semibold transition-colors hover:text-foreground">
            {t.linkAbout}
          </Link>
        </motion.div>
      </section>
    </main>
  );
};

export default Hero;
