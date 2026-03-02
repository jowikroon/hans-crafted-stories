import { motion } from "framer-motion";
import { Download, MapPin, Mail, Linkedin, Briefcase, GraduationCap, ChevronRight, Home } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { ObfuscatedMailto } from "@/components/ObfuscatedMailto";
import { Link } from "react-router-dom";
import hansProfile from "@/assets/hans-profile.jpg";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import { usePageElements } from "@/hooks/usePageElements";
import { useSEO } from "@/hooks/useSEO";
import { usePageContent } from "@/hooks/usePageContent";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const About = () => {
  const { lang } = useLang();
  const t = translations[lang];
  const { isVisible } = usePageElements("about");
  const { getValue } = usePageContent("about");

  const seo = t.seo;

  useSEO({
    title: seo.aboutTitle,
    description: seo.aboutDescription,
    url: "https://hansvanleeuwen.com/about",
    hreflang: [
      { lang: "en", href: "https://hansvanleeuwen.com/about" },
      { lang: "nl", href: "https://hansvanleeuwen.com/about" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/about" },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ProfilePage",
          mainEntity: { "@id": "https://hansvanleeuwen.com/#person" },
          name: seo.aboutTitle,
          url: "https://hansvanleeuwen.com/about",
          isPartOf: { "@id": "https://hansvanleeuwen.com/#website" },
        },
        {
          "@type": "Person",
          "@id": "https://hansvanleeuwen.com/#person",
          name: "Hans van Leeuwen",
          url: "https://hansvanleeuwen.com/about",
          jobTitle: "Freelance E-commerce Manager",
          description: "Freelance e-commerce manager with 10+ years of experience in marketplace strategy, Amazon, Bol.com, and digital commerce.",
          image: {
            "@type": "ImageObject",
            url: "https://hansvanleeuwen.com/og-image.png",
            width: 1200,
            height: 630,
            caption: "Hans van Leeuwen – Freelance E-commerce Manager",
          },
          knowsAbout: ["E-commerce", "Amazon", "Bol.com", "Marketplace optimization", "UX design", "Conversion optimization", "Digital commerce", "SEO", "Amazon Ads", "Bol Ads"],
          address: {
            "@type": "PostalAddress",
            addressLocality: "Amersfoort",
            addressCountry: "NL",
          },
          sameAs: [
            "https://www.linkedin.com/in/hansvl3",
            "https://www.behans.nl",
          ],
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
            { "@type": "ListItem", position: 2, name: "About", item: "https://hansvanleeuwen.com/about" },
          ],
        },
      ],
    },
  });

  return (
    <section className="relative section-container pt-28 pb-20 overflow-hidden">
      {/* Subtle Stargate-inspired background rings */}
      {isVisible("stargate_decorations") && (
        <>
          <div className="pointer-events-none absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 opacity-[0.03]">
            <svg width="800" height="800" viewBox="0 0 800 800" fill="none">
              <circle cx="400" cy="400" r="380" stroke="currentColor" strokeWidth="1" className="text-primary" />
              <circle cx="400" cy="400" r="320" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
              <circle cx="400" cy="400" r="260" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <g key={angle} transform={`rotate(${angle} 400 400)`}>
                  <rect x="396" y="24" width="8" height="20" rx="2" fill="currentColor" className="text-primary" />
                </g>
              ))}
            </svg>
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 opacity-[0.02]">
            <svg width="600" height="600" viewBox="0 0 600 600" fill="none">
              <circle cx="300" cy="300" r="280" stroke="currentColor" strokeWidth="1" className="text-primary" />
              <circle cx="300" cy="300" r="220" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
            </svg>
          </div>
        </>
      )}

      {isVisible("breadcrumb") && (
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
          <span className="font-medium text-foreground">About</span>
        </motion.nav>
      )}

      <motion.div {...fadeIn}>
        {/* Header */}
        <div className="mb-20 grid gap-12 md:grid-cols-5">
          {isVisible("profile_photo") && (
            <motion.div
              className="md:col-span-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative">
                <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 blur-sm" />
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted ring-1 ring-border/50">
                  <img src={hansProfile} alt="Hans van Leeuwen — Freelance E-commerce Manager based in Amersfoort, Netherlands" width={600} height={800} className="h-full w-full object-cover object-top" />
                  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background/40 to-transparent" />
                </div>
                <div className="absolute -bottom-2 -right-2 flex items-center gap-0.5 rounded-full border border-primary/20 bg-background px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-primary shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="ml-1.5">{getValue("about_years_badge", `10+ ${lang === "nl" ? "jaar" : "years"}`)}</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className={isVisible("profile_photo") ? "md:col-span-3" : "md:col-span-5"}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px w-8 bg-primary/60" />
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">{getValue("about_label", t.about)}</p>
              </div>
              <h1 className="mb-6 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
                {getValue("about_name", "Hans van Leeuwen")}
              </h1>

              {isVisible("bio_section") && (
              <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                  <p>{getValue("about_bio_1", t.bio[0])}</p>
                  <p>{getValue("about_bio_2", t.bio[1])}</p>
                </div>
              )}

              {isVisible("contact_details") && (
                <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-primary" /> {getValue("about_location", "Amersfoort, NL")}
                  </span>
                  <a href="#contact" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
                    <Mail size={14} className="text-primary" /> {lang === "nl" ? "Stuur een bericht" : "Send a message"}
                  </a>
                  <ObfuscatedMailto user="hansvl3" domain="gmail.com" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground" aria-label={lang === "nl" ? "E-mail sturen" : "Send email"}>
                    {lang === "nl" ? "Of e-mail" : "Or email"}
                  </ObfuscatedMailto>
                  <a href={getValue("about_linkedin_url", "https://linkedin.com/in/hansvl3")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
                    <Linkedin size={14} className="text-primary" /> {getValue("about_linkedin_label", "LinkedIn")}
                  </a>
                </div>
              )}

              {isVisible("cv_downloads") && (
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="/Hans_CV_-_e-commerce_manager.pdf" download className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:opacity-80 hover:shadow-lg hover:shadow-foreground/10">
                    <Download size={14} /> {getValue("about_cv_en_label", t.downloadCvEn)}
                    <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                  </a>
                  <a href="/Cv_HvL_-_Ecommerce.pdf" download className="group inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-secondary hover:border-primary/20">
                    <Download size={14} /> {getValue("about_cv_nl_label", t.downloadCvNl)}
                    <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Skills */}
        {isVisible("skills_section") && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} className="mb-20">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <h2 className="font-display text-2xl font-medium text-foreground">{getValue("about_skills_heading", t.coreCompetencies)}</h2>
            </div>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">{lang === "nl" ? "Expertisegebieden" : "Key expertise areas"}</h3>
            <motion.div className="flex flex-wrap gap-2" variants={staggerChildren} initial="initial" whileInView="animate" viewport={{ once: true }}>
              {t.skills.map((skill, i) => (
                <motion.div key={skill} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                  <Badge variant="secondary" className="px-3 py-1.5 text-sm font-normal transition-colors hover:bg-primary/10 hover:text-primary">
                    {skill}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Experience */}
        {isVisible("experience_section") && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} className="mb-20">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                <Briefcase size={14} className="text-primary" />
              </div>
              <h2 className="font-display text-2xl font-medium text-foreground">{getValue("about_experience_heading", t.experience)}</h2>
            </div>
            <div className="space-y-0">
              {t.experienceList.map((job, i) => (
                <motion.div
                  key={`${job.company}-${job.period}`}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group relative border-l-2 border-border py-6 pl-8 transition-colors first:pt-0 last:pb-0 hover:border-l-primary/40"
                >
                  <div className="absolute -left-[7px] top-6 first:top-0 h-3 w-3 rounded-full border-2 border-primary bg-background transition-shadow group-hover:shadow-[0_0_8px_hsl(var(--primary)/0.3)]" />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-medium text-foreground">{job.role}</h3>
                      <p className="text-sm text-primary">{job.company}</p>
                    </div>
                    <span className="rounded-full border border-border bg-secondary/50 px-3 py-0.5 text-[11px] text-muted-foreground">{job.period}</span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {job.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                        <ChevronRight size={12} className="mt-1 shrink-0 text-primary/40" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Education */}
        {isVisible("education_section") && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                <GraduationCap size={14} className="text-primary" />
              </div>
              <h2 className="font-display text-2xl font-medium text-foreground">{getValue("about_education_heading", t.education)}</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {t.educationList.map((edu, i) => (
                <motion.div
                  key={edu.institution}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-xl border border-border p-6 transition-all hover:border-primary/20 hover:shadow-md hover:shadow-primary/5"
                >
                  <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full border border-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <h3 className="font-display text-base font-medium text-foreground">{edu.degree}</h3>
                  <p className="mt-1 text-sm text-primary">{edu.institution}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{edu.period}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Contact Form */}
        {isVisible("contact_form") && (
          <motion.div id="contact" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} className="mt-20">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                <Mail size={14} className="text-primary" />
              </div>
              <h2 className="font-display text-2xl font-medium text-foreground">{t.contact.heading}</h2>
            </div>
            <ContactForm />
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};

export default About;
