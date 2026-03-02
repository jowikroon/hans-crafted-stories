import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/hooks/useLang";

const faqs = [
  {
    question: "What marketplaces does Hans van Leeuwen specialize in?",
    questionNl: "Welke marktplaatsen zijn Hans van Leeuwens specialiteit?",
    answer:
      "Hans specializes in Amazon and Bol.com marketplace management, including product listing optimization, advertising (Amazon Ads, Bol Ads), A+ content creation, catalog management, and growth strategy.",
    answerNl:
      "Hans is gespecialiseerd in Amazon en Bol.com, inclusief listing-optimalisatie, adverteren (Amazon Ads, Bol Ads), A+-content, catalogusbeheer en groeistrategie.",
  },
  {
    question: "What e-commerce services does Hans offer?",
    questionNl: "Welke e-commerce diensten biedt Hans aan?",
    answer:
      "Hans provides marketplace management, conversion rate optimization (CRO), UX design for e-commerce, SEO & content strategy, data-driven analytics, and digital commerce consulting for brands across the Netherlands and EU.",
    answerNl:
      "Hans biedt marktplaatsbeheer, conversieoptimalisatie (CRO), UX-design voor e-commerce, SEO & contentstrategie, data-analyse en digitale commerce consultancy voor merken in Nederland en de EU.",
  },
  {
    question: "Is Hans van Leeuwen available for freelance or contract work?",
    questionNl: "Is Hans van Leeuwen beschikbaar voor freelance of opdrachten?",
    answer:
      "Hans is based in Amersfoort, Netherlands and available for e-commerce management roles, consulting, and freelance marketplace projects. Contact via LinkedIn or email for availability.",
    answerNl:
      "Hans is gevestigd in Amersfoort, Nederland en beschikbaar voor e-commerce managementrollen, consultancy en freelance marktplaatsprojecten. Neem contact op via LinkedIn of e-mail voor beschikbaarheid.",
  },
];

const HomeFAQ = () => {
  const { lang } = useLang();
  const isNl = lang === "nl";
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const heading = isNl ? "Veelgestelde vragen" : "Frequently Asked Questions";
  const label = isNl ? "FAQ" : "FAQ";

  return (
    <section
      className="section-container pb-20"
      aria-label={label}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <h2 className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          {label}
        </h2>
        <p className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {heading}
        </p>
      </motion.div>

      <dl className="space-y-2">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          const question = isNl ? faq.questionNl : faq.question;
          const answer = isNl ? faq.answerNl : faq.answer;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl border-2 border-border/40 bg-card overflow-hidden"
            >
              <dt>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-foreground hover:bg-muted/30 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{question}</span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </dt>
              {/* Answer always in DOM for crawlability; visually collapsed via CSS */}
              <dd
                className={`transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                }`}
                aria-hidden={!isOpen}
              >
                <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-3">
                  {answer}
                </div>
              </dd>
              {/* Hidden copy always visible to crawlers */}
              <noscript>
                <dd className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-3">
                  {answer}
                </dd>
              </noscript>
            </motion.div>
          );
        })}
      </dl>

      <p className="mt-6 text-sm text-muted-foreground">
        {isNl
          ? "Meer vragen? "
          : "More questions? "}
        <a
          href="mailto:hansvl3@gmail.com"
          className="font-semibold text-foreground underline-offset-4 hover:underline"
        >
          {isNl ? "Stuur een bericht" : "Send a message"}
        </a>
        {" "}
        {isNl
          ? "of "
          : "or "}
        <a
          href="https://www.linkedin.com/in/hansvl3"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-foreground underline-offset-4 hover:underline"
        >
          {isNl ? "verbind op LinkedIn" : "connect on LinkedIn"}
        </a>
        .
      </p>
    </section>
  );
};

export default HomeFAQ;
