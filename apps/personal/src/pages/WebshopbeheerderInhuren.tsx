import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Home, ChevronRight, Store } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { PERSON_ENTITY, PROFESSIONAL_SERVICE_ENTITY } from "@/lib/seo/sharedEntities";

const fade = {
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } as const,
};

const content = {
  nl: {
    title: "Webshopbeheerder Inhuren — Freelance, Senior, Direct Inzetbaar",
    metaDesc:
      "Webshopbeheerder inhuren zonder tussenpartij. 10+ jaar Amazon NL, bol.com en Magento. 70% marktaandeel (Nielsen), voorraadtekorten onder 2%. Amersfoort, NL/EU.",
    breadcrumb: "Webshopbeheerder inhuren",
    h1: "Webshopbeheerder inhuren",
    subtitle: "Freelance en senior, geen bureau en geen tussenpartij",
    intro:
      "Je zoekt iemand die je webshop draaiende houdt en laat groeien. Niet iemand die een rapport schrijft over wat er zou moeten gebeuren. Ik werk als operator: ik zit zelf in Seller Central, in het feedplatform en in de cijfers, en ik ben aanspreekbaar op wat eruit komt.",
    servicesHeading: "Wat webshopbeheer bij mij inhoudt",
    services: [
      "Productdata en content: titels, specificaties, afbeeldingen, categorisering",
      "Voorraad en levertijden: forecasting, bestelmomenten, uit-voorraad voorkomen",
      "Prijs en marge: prijsregels, concurrentiemonitoring, Buy Box",
      "Marketplaces: Amazon NL en DE, bol.com, eBay — listings, ads, compliance",
      "Feeds en koppelingen: Channable, Magento, ERP-synchronisatie",
      "Orders en retouren: doorlooptijd, track & trace, klachtafhandeling",
      "Rapportage: één wekelijks overzicht waarin je ziet wat er is gebeurd en waarom",
      "Automatisering: terugkerend handwerk wegnemen met n8n en AI-workflows",
    ],
    resultsHeading: "Wat het heeft opgeleverd",
    results: [
      { stat: "70%", desc: "marktaandeel in de oordoppencategorie op Amazon NL (Nielsen-data)" },
      { stat: "<2%", desc: "uit-voorraadpercentage door betere forecasting" },
      { stat: "20%", desc: "wekelijkse omzetstijging via gerichte campagnes" },
    ],
    approachHeading: "Inhuren of aannemen — de afweging die je echt maakt",
    approach: [
      "De meeste webshops die een beheerder zoeken, zitten in een tussenfase. Te veel werk voor de eigenaar erbij, te weinig voor een vaste kracht van veertig uur. Inhuren lost dat op zolang je het als tijdelijk ziet: iemand zet de operatie neer, documenteert hem, en draagt hem over aan wie er daarna zit. Wordt het een permanente afhankelijkheid, dan is aannemen op termijn goedkoper.",
      "Marktbreed liggen freelancetarieven voor webshopbeheer tussen ongeveer €40 en €95 per uur, afhankelijk van seniority en scope. Dat verschil zit zelden in snelheid en bijna altijd in oordeel: weten wanneer je een listing níet moet aanpassen, welke voorraadmelding er wel toe doet, en welke advertentie je laat lopen ondanks een slechte week. Vraag daarom niet naar het uurtarief maar naar wat er in maand drie anders is.",
      "Zelf werk ik in drie vormen: een afgebakende opdracht met een vast resultaat, een maandelijkse basis voor doorlopend beheer, of een dagtarief voor interim-invulling. Wat de vorm ook is, de afspraak is dezelfde — jij houdt toegang tot alle accounts, data en werkdocumenten. Als ik wegga, gaat er niets met me mee.",
    ],
    honestHeading: "Wanneer ik niet de juiste keuze ben",
    honest: [
      "Je zoekt iemand voor uitsluitend uitvoerend werk tegen het laagste tarief. Daar zijn platformen en junioren beter en goedkoper voor.",
      "Je webshop draait op een platform dat ik niet ken en dat ook niet gaat veranderen. Ik werk met Magento, Shopify, Amazon, bol.com en eBay.",
      "Je wilt vooral advies op papier. Ik lever dat wel, maar dat is niet waar mijn waarde zit.",
    ],
    ctaHeading: "Kort overleg over wat je nodig hebt",
    ctaText:
      "Dertig minuten, geen verplichting. Ik kijk mee naar je huidige situatie en zeg eerlijk of inhuren hier de juiste oplossing is. Binnen één werkdag een schriftelijk voorstel.",
    ctaButton: "Neem contact op",
  },
  en: {
    title: "Hire a Webshop Manager — Freelance, Senior, Available Now",
    metaDesc:
      "Hire a freelance webshop manager without an agency in between. 10+ years across Amazon NL, bol.com and Magento. 70% category share (Nielsen), stockouts below 2%. Amersfoort, NL/EU.",
    breadcrumb: "Hire a webshop manager",
    h1: "Hire a webshop manager",
    subtitle: "Freelance and senior, no agency and no middleman",
    intro:
      "You need someone to keep your webshop running and growing. Not someone who writes a report about what ought to happen. I work as an operator: I'm in Seller Central, in the feed platform and in the numbers myself, and I'm accountable for what comes out.",
    servicesHeading: "What webshop management covers here",
    services: [
      "Product data and content: titles, specifications, images, categorisation",
      "Stock and lead times: forecasting, reorder points, preventing stockouts",
      "Price and margin: pricing rules, competitor monitoring, Buy Box",
      "Marketplaces: Amazon NL and DE, bol.com, eBay — listings, ads, compliance",
      "Feeds and integrations: Channable, Magento, ERP synchronisation",
      "Orders and returns: lead time, track & trace, complaint handling",
      "Reporting: one weekly view showing what happened and why",
      "Automation: removing recurring manual work with n8n and AI workflows",
    ],
    resultsHeading: "What it has produced",
    results: [
      { stat: "70%", desc: "category share in earplugs on Amazon NL (Nielsen data)" },
      { stat: "<2%", desc: "out-of-stock rate through better forecasting" },
      { stat: "20%", desc: "weekly revenue increase via targeted campaigns" },
    ],
    approachHeading: "Hiring vs. employing — the choice you're actually making",
    approach: [
      "Most webshops looking for a manager are in an in-between phase. Too much work for the owner to absorb, not enough for a full-time hire. Freelance solves that as long as you treat it as temporary: someone builds the operation, documents it, and hands it over to whoever comes next. If it becomes a permanent dependency, employing is cheaper in the long run.",
      "Across the Dutch market, freelance rates for webshop management run roughly €40 to €95 per hour depending on seniority and scope. That gap is rarely about speed and almost always about judgement: knowing when not to touch a listing, which stock alert actually matters, and which campaign to leave running despite a bad week. So don't ask about the hourly rate — ask what will be different in month three.",
      "I work in three shapes: a scoped project with a fixed outcome, a monthly retainer for ongoing management, or a day rate for interim cover. Whatever the shape, the arrangement is the same — you keep access to every account, dataset and working document. When I leave, nothing leaves with me.",
    ],
    honestHeading: "When I'm not the right choice",
    honest: [
      "You want purely executional work at the lowest possible rate. Platforms and junior staff are better and cheaper for that.",
      "Your shop runs on a platform I don't know and that isn't going to change. I work with Magento, Shopify, Amazon, bol.com and eBay.",
      "You mainly want advice on paper. I'll deliver it, but it isn't where my value sits.",
    ],
    ctaHeading: "A short call about what you need",
    ctaText:
      "Thirty minutes, no obligation. I'll look at your current setup and tell you honestly whether hiring a freelancer is the right answer here. Written proposal within one working day.",
    ctaButton: "Get in touch",
  },
};

const WebshopbeheerderInhuren = () => {
  const { lang } = useLang();
  const t = content[lang === "nl" ? "nl" : "en"];

  useSEO({
    title: t.title,
    description: t.metaDesc,
    canonical: "https://hansvanleeuwen.com/webshopbeheerder-inhuren",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        PERSON_ENTITY,
        PROFESSIONAL_SERVICE_ENTITY,
        {
          "@type": "WebPage",
          url: "https://hansvanleeuwen.com/webshopbeheerder-inhuren",
          name: t.title,
          isPartOf: { "@id": "https://hansvanleeuwen.com/#website" },
          about: { "@id": "https://hansvanleeuwen.com/#person" },
          inLanguage: lang === "nl" ? "nl" : "en",
        },
        {
          "@type": "Service",
          name: lang === "nl" ? "Webshopbeheer" : "Webshop Management",
          provider: { "@id": "https://hansvanleeuwen.com/#organization" },
          areaServed: { "@type": "Country", name: "Netherlands" },
          description: t.metaDesc,
        },
        {
          // De tariefvraag is de meestgestelde vervolgvraag op deze zoekopdracht.
          // Beantwoorden in FAQ-schema vangt zowel het rich result als het AI-antwoord.
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: lang === "nl" ? "Wat kost het inhuren van een webshopbeheerder?" : "What does hiring a webshop manager cost?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  lang === "nl"
                    ? "Freelancetarieven voor webshopbeheer liggen in Nederland doorgaans tussen €40 en €95 per uur, afhankelijk van seniority en scope. Daarnaast zijn een maandelijkse basis voor doorlopend beheer en een dagtarief voor interim-invulling gebruikelijk. Het verschil in tarief zit zelden in snelheid en bijna altijd in oordeel."
                    : "Freelance rates for webshop management in the Netherlands typically run between €40 and €95 per hour, depending on seniority and scope. Monthly retainers for ongoing management and day rates for interim cover are also common. The difference in rate is rarely about speed and almost always about judgement.",
              },
            },
            {
              "@type": "Question",
              name: lang === "nl" ? "Wat doet een webshopbeheerder precies?" : "What does a webshop manager actually do?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  lang === "nl"
                    ? "Productdata en content, voorraad en forecasting, prijs en marge, marketplace-listings en advertenties, feeds en koppelingen, orders en retouren, en wekelijkse rapportage. Bij grotere webshops komt daar automatisering van terugkerend handwerk bij."
                    : "Product data and content, stock and forecasting, price and margin, marketplace listings and advertising, feeds and integrations, orders and returns, and weekly reporting. At larger shops this extends to automating recurring manual work.",
              },
            },
            {
              "@type": "Question",
              name: lang === "nl" ? "Inhuren of iemand aannemen?" : "Should I hire a freelancer or employ someone?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  lang === "nl"
                    ? "Inhuren past bij de tussenfase: te veel werk voor de eigenaar, te weinig voor een vaste kracht. Behandel het als tijdelijk — de operatie wordt opgezet, gedocumenteerd en overgedragen. Wordt het een permanente afhankelijkheid, dan is aannemen op termijn goedkoper."
                    : "Freelance suits the in-between phase: too much work for the owner, not enough for a full-time hire. Treat it as temporary — the operation gets built, documented and handed over. If it becomes a permanent dependency, employing is cheaper long term.",
              },
            },
          ],
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
            { "@type": "ListItem", position: 2, name: t.breadcrumb, item: "https://hansvanleeuwen.com/webshopbeheerder-inhuren" },
          ],
        },
      ],
    },
  });

  return (
    <section className="relative section-container pt-28 pb-20">
      <motion.nav {...fade} className="mb-8 flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground"><Home size={12} /><span>Home</span></Link>
        <ChevronRight size={11} className="text-muted-foreground/40" />
        <span className="font-medium text-foreground">{t.breadcrumb}</span>
      </motion.nav>

      <motion.div {...fade}>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Store size={20} /></div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
            {lang === "nl" ? "Freelance webshopbeheer" : "Freelance webshop management"}
          </p>
        </div>
        <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">{t.h1}</h1>
        <p className="mb-6 font-display text-base font-medium text-muted-foreground md:text-lg">{t.subtitle}</p>
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t.intro}</p>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t.servicesHeading}</h2>
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {t.services.map((item, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-border/40 bg-card p-4">
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-sm leading-relaxed text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t.resultsHeading}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {t.results.map((r, i) => (
            <div key={i} className="rounded-xl border-2 border-border/40 bg-card p-6 text-center">
              <p className="mb-2 font-display text-3xl font-bold text-primary">{r.stat}</p>
              <p className="text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...fade} className="mb-16 max-w-3xl">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t.approachHeading}</h2>
        <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
          {t.approach.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </motion.div>

      {/* Eerlijk zijn over wanneer je niet de juiste keuze bent, is het enige wat een
          platform of bureau op deze zoekopdracht nooit zal schrijven. */}
      <motion.div {...fade} className="mb-16 max-w-3xl rounded-2xl border border-border/40 bg-card p-6 md:p-8">
        <h2 className="mb-4 font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">{t.honestHeading}</h2>
        <ul className="space-y-3" role="list">
          {t.honest.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div {...fade} className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 md:p-12 text-center">
        <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t.ctaHeading}</h2>
        <p className="mb-6 max-w-xl mx-auto text-sm text-muted-foreground">{t.ctaText}</p>
        <a href="/about#contact" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-all hover:gap-3 hover:shadow-lg">
          {t.ctaButton} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </a>
        <p className="mt-6 text-xs text-muted-foreground/60">
          <Link to="/interim-ecommerce-manager" className="underline hover:text-foreground">{lang === "nl" ? "Interim e-commerce manager" : "Interim e-commerce manager"}</Link>
          {" · "}
          <Link to="/amazon-nl-specialist" className="underline hover:text-foreground">{lang === "nl" ? "Amazon NL specialist" : "Amazon NL specialist"}</Link>
          {" · "}
          <Link to="/bol-com-consultant" className="underline hover:text-foreground">{lang === "nl" ? "Bol.com consultant" : "Bol.com consultant"}</Link>
          {" · "}
          <Link to="/work" className="underline hover:text-foreground">{lang === "nl" ? "Case studies" : "Case studies"}</Link>
        </p>
      </motion.div>
    </section>
  );
};

export default WebshopbeheerderInhuren;
