import { useEffect, useRef, useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { ObfuscatedMailto } from "@/components/ObfuscatedMailto";
import { Link } from "@/components/LocalizedLink";
import hansProfile from "@/assets/hans-profile.jpg";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import { useSEO } from "@/hooks/useSEO";
import { ABOUT, CALENDLY_URL, LINKEDIN_URL } from "@/data/aboutPage";
import "@/styles/about-v2.css";

// /about redesign (2026-10-15). Order follows the visitor's questions:
// who is this, proof, why him (story), the common thread, career, services, contact.
// Only one filled button style on the page: the call booking. Main fonts only.

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const SectionHead = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <div className="av-sechead">
    <span className="av-dot" aria-hidden="true"><span /></span>
    <h2 id={id}>{children}</h2>
  </div>
);

const About = () => {
  const { lang } = useLang();
  const t = translations[lang];
  const c = ABOUT[lang];
  const seo = t.seo;

  const midCtaRef = useRef<HTMLAnchorElement>(null);
  const contactRef = useRef<HTMLElement>(null);
  const [stickyOn, setStickyOn] = useState(false);

  // Mobile sticky CTA: only between the CTA after "De rode draad" and the contact section.
  useEffect(() => {
    const mid = midCtaRef.current;
    const contact = contactRef.current;
    if (!mid || !contact || typeof IntersectionObserver === "undefined") return;
    let past = false;
    let atEnd = false;
    const update = () => setStickyOn(past && !atEnd);
    const o1 = new IntersectionObserver(([e]) => { past = !e.isIntersecting && e.boundingClientRect.top < 0; update(); });
    const o2 = new IntersectionObserver(([e]) => { atEnd = e.isIntersecting || e.boundingClientRect.top < 0; update(); });
    o1.observe(mid);
    o2.observe(contact);
    return () => { o1.disconnect(); o2.disconnect(); };
  }, []);

  useSEO({
    title: seo.aboutTitle,
    description: seo.aboutDescription,
    imageAlt: c.photoAlt,
    path: "/about",
    lang,
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
          jobTitle: "E-commerce Manager",
          alternateName: "Jowikroon",
          description: lang === "nl"
            ? "Hans van Leeuwen is marketplace manager voor Amazon, Bol.com en eBay uit Amersfoort, met een achtergrond in ICT-beheer (sinds 2008) en UX (Hogeschool Utrecht)."
            : "Hans van Leeuwen is a marketplace manager for Amazon, Bol.com and eBay based in Amersfoort, with a background in IT administration (since 2008) and UX (Hogeschool Utrecht).",
          image: { "@type": "ImageObject", url: `https://hansvanleeuwen.com${hansProfile}`, caption: c.photoAlt },
          // Current employer as shown on the page. Never a parent or supplier company (hard rule 2026-10-15).
          worksFor: { "@type": "Organization", name: "Connect Car Parts" },
          alumniOf: [
            { "@type": "CollegeOrUniversity", name: "Hogeschool Utrecht" },
            { "@type": "EducationalOrganization", name: "ROC Hilversum" },
          ],
          knowsAbout: ["Amazon", "Bol.com", "eBay", "Marketplace management", "UX design", "Interaction design", "SEO", "Conversion optimization", "Channable", "E-commerce automation", "Amazon Ads", "Bol Ads"],
          address: { "@type": "PostalAddress", addressLocality: "Amersfoort", addressCountry: "NL" },
          sameAs: [
            LINKEDIN_URL,
            "https://x.com/hansvl3",
            "https://github.com/jowikroon",
            "https://www.youtube.com/@jowikroon1990",
            "https://soundcloud.com/jowikroon",
          ],
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
            { "@type": "ListItem", position: 2, name: c.crumb, item: "https://hansvanleeuwen.com/about" },
          ],
        },
      ],
    },
  });

  const contactRow = (
    <p className="av-contactrow">
      <ObfuscatedMailto user="hansvl3" domain="gmail.com" aria-label={c.email}>{c.email}</ObfuscatedMailto>
      <span aria-hidden="true">·</span>
      <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">LinkedIn</a>
    </p>
  );

  return (
    <div className="about-v2">
      {/* HERO */}
      <section className="av-wrap av-hero" aria-labelledby="av-h1">
        <nav className="av-crumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={11} aria-hidden="true" />
          <span aria-current="page">{c.crumb}</span>
        </nav>
        <div className="av-hero-grid">
          <div className="av-hero-text">
            <p className="av-eyebrow av-eyebrow-line">{c.eyebrow}</p>
            <div className="av-kicker-row">
              <img className="av-avatar" src={hansProfile} alt="" width={72} height={72} />
              <div>
                <h1 id="av-h1" className="av-kicker">{c.kicker}</h1>
                <p className="av-meta av-loc"><MapPin size={14} aria-hidden="true" />{c.location}</p>
              </div>
            </div>
            <p className="av-display">{c.display}</p>
            <p className="av-lead">{c.lead}</p>
            <div className="av-actions">
              <a className="av-btn" href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">{c.cta}<Arrow /></a>
              <Link className="av-textlink" to="/work">{c.casesLink} <span aria-hidden="true">→</span></Link>
            </div>
            {contactRow}
            <nav className="av-anchors" aria-label={c.onThisPage}>
              <span>{c.onThisPage}</span>
              <a href="#verhaal">{c.anchors.story}</a>
              <a href="#loopbaan">{c.anchors.career}</a>
              <a href="#diensten">{c.anchors.services}</a>
              <a href="#contact">{c.anchors.contact}</a>
            </nav>
          </div>
          <figure className="av-photo">
            <img src={hansProfile} alt={c.photoAlt} width={600} height={800} loading="eager" {...{ fetchpriority: "high" }} decoding="async" />
          </figure>
        </div>
      </section>

      {/* PROOF */}
      <section className="av-wrap av-proof" aria-label={lang === "nl" ? "Resultaten" : "Results"}>
        <ul className="av-stats">
          {c.stats.map((s) => (
            <li key={s.value}>
              <span className="av-num">{s.value}</span>
              <span className="av-stat-label">{s.label}</span>
              <span className="av-stat-src">{s.source}</span>
            </li>
          ))}
        </ul>
        <Link className="av-textlink av-proof-link" to="/work">{c.casesLink2} <span aria-hidden="true">→</span></Link>
      </section>

      {/* STORY */}
      <section className="av-wrap av-section" id="verhaal" aria-labelledby="av-verhaal">
        <SectionHead id="av-verhaal">{c.storyHeading}</SectionHead>
        <div className="av-chapter av-intro">
          <div className="av-margin" />
          <div className="av-body"><p className="av-introp">{c.storyIntro}</p></div>
        </div>
        <div className="av-chapters">
          {c.chapters.map((ch) => (
            <article className="av-chapter" key={ch.title}>
              <div className="av-margin">
                <p className="av-eyebrow">{ch.period}</p>
                {ch.metric && (<><p className="av-mnum">{ch.metric.value}</p><p className="av-msrc">{ch.metric.label}</p></>)}
              </div>
              <div className="av-body">
                <h3>{ch.title}</h3>
                {ch.paragraphs.map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
                {ch.rules && (
                  <>
                    <p>{ch.rules.intro}</p>
                    <ul className="av-rules">{ch.rules.items.map((r) => <li key={r}>{r}</li>)}</ul>
                    <p>{ch.rules.outro}</p>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* COMMON THREAD + MID CTA */}
      <section className="av-wrap av-thread" aria-labelledby="av-thread">
        <div className="av-thread-inner">
          <span className="av-rule" aria-hidden="true" />
          <p className="av-eyebrow">{c.thread.eyebrow}</p>
          <h2 id="av-thread" className="av-sr">{c.thread.heading}</h2>
          <p className="av-thread-pre">{c.thread.pre}</p>
          <p className="av-quote">{c.thread.quote}</p>
          <p className="av-thread-post">{c.thread.post}</p>
          <div className="av-midcta">
            <p className="av-midcta-q">{c.thread.question}</p>
            <a ref={midCtaRef} className="av-btn" href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">{c.cta}<Arrow /></a>
          </div>
        </div>
      </section>

      {/* CAREER */}
      <section className="av-wrap av-section" id="loopbaan" aria-labelledby="av-loopbaan">
        <SectionHead id="av-loopbaan">{c.careerHeading}</SectionHead>
        <ol className="av-roles">
          {c.roles.map((r) => (
            <li key={r.period + r.title}>
              <span className="av-period">{r.period}</span>
              <div className="av-role"><h3>{r.title}</h3><p className="av-org">{r.org}</p></div>
              <div className="av-roledesc">
                <p>{r.summary}</p>
                {r.details && (
                  <details>
                    <summary>{c.resultsToggle}</summary>
                    <ul>{r.details.map((d) => <li key={d}>{d}</li>)}</ul>
                  </details>
                )}
              </div>
            </li>
          ))}
        </ol>
        <div className="av-subgrid">
          <div>
            <h3 className="av-subhead">{c.eduHeading}</h3>
            <ul className="av-edu">
              {c.edu.map((e) => (
                <li key={e.title}>
                  <span className="av-period">{e.period}</span>
                  <span><strong>{e.title}</strong><br /><span className="av-org">{e.org}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="av-subhead">{c.skillsHeading}</h3>
            <dl className="av-skills">
              {c.skills.map((s) => (<div key={s.group}><dt>{s.group}</dt><dd>{s.items}</dd></div>))}
            </dl>
            <a className="av-textlink" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">{c.linkedinLink} <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="av-wrap av-section" id="diensten" aria-labelledby="av-diensten">
        <SectionHead id="av-diensten">{c.servicesHeading}</SectionHead>
        <div className="av-services">
          {c.services.map((s) => (
            <Link className="av-service" to={s.to} key={s.to}>
              <h3>{s.title}</h3>
              <p>{s.copy}</p>
              <span className="av-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
        <p className="av-tools">{c.tools}</p>
        <Link className="av-textlink" to="/work">{c.allCasesLink} <span aria-hidden="true">→</span></Link>
      </section>

      {/* CONTACT */}
      <section ref={contactRef} className="av-wrap av-section" id="contact" aria-labelledby="av-contact">
        <SectionHead id="av-contact">{c.contactHeading}</SectionHead>
        <div className="av-contact">
          <div className="av-card av-card-tint">
            <p className="av-contact-lead">{c.contactLead}</p>
            <a className="av-btn" href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">{c.cta}<Arrow /></a>
            <p className="av-meta av-offer">
              {c.offer} <Link to="/rates">{c.ratesLink}</Link> · <Link to="/interim-ecommerce-manager">{c.howLink}</Link>
            </p>
            {contactRow}
          </div>
          <div className="av-card av-form">
            <h3>{c.formHeading}</h3>
            <ContactForm reasonFirst reasonHelp={c.reasonHelp} outlineSubmit className="grid gap-5 sm:grid-cols-2" />
          </div>
        </div>
      </section>

      <div className={`av-sticky${stickyOn ? " is-on" : ""}`} aria-hidden={!stickyOn}>
        <a className="av-btn" href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" tabIndex={stickyOn ? 0 : -1}>{c.ctaShort}</a>
      </div>
    </div>
  );
};

export default About;
