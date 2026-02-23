import { motion } from "framer-motion";
import { Download, MapPin, Mail, Linkedin, Briefcase, GraduationCap } from "lucide-react";
import hansProfile from "@/assets/hans-profile.jpg";
import { Badge } from "@/components/ui/badge";

const experience = [
  {
    company: "ABS All Brake Systems",
    role: "E-commerce Manager",
    period: "Dec 2025 – Present",
    highlights: [
      "Leading growth strategy for marketplaces and D2C webshop",
      "Implementing A/B testing frameworks and automation",
      "Forecasting revenue and delivering actionable KPI insights",
    ],
  },
  {
    company: "Alpine Hearing Protection",
    role: "Marketplace Manager",
    period: "Feb 2022 – Dec 2025",
    highlights: [
      "Achieved 70% market share in earplug category (Nielsen Data)",
      "Launched Bol.com seller channel, transitioning from vendor model",
      "20% weekly sales increase via Muffy Kids social campaign",
    ],
  },
  {
    company: "Alpine Hearing Protection",
    role: "E-commerce Manager",
    period: "Oct 2021 – Mar 2022",
    highlights: [
      "Cut out-of-stock rates below 2%",
      "Outsourced customer service, improving NPS scores",
      "Centralized data and refined shipping logistics",
    ],
  },
  {
    company: "Webhelp",
    role: "Team Coach",
    period: "Feb 2020 – Oct 2021",
    highlights: [
      "Directed COVID-19 tracking, aiding national strategies",
      "Implemented training to boost pandemic response skills",
    ],
  },
  {
    company: "IGM (badkamerwinkel.nl)",
    role: "E-commerce Manager",
    period: "Aug 2019 – Feb 2020",
    highlights: [
      "Enhanced organic traffic via SEO strategy",
      "Improved content, UX, and product listings",
    ],
  },
  {
    company: "Intergamma (Karwei & Gamma)",
    role: "E-Commerce Manager",
    period: "Feb 2017 – Aug 2019",
    highlights: [
      "Managed online catalogs for KARWEI.nl, Gamma.nl & Gamma.be",
      "Delivered company-wide e-commerce training",
      "Grew organic search traffic with SEO tactics",
    ],
  },
  {
    company: "Talpa",
    role: "Online Marketeer",
    period: "Jan 2015 – Jun 2015",
    highlights: [
      "Drove web and social media strategies for Dutch television",
    ],
  },
  {
    company: "Edelman",
    role: "Graphic & UX Designer",
    period: "Sep 2013 – Jan 2014",
    highlights: [
      "Spearheaded design projects at the world's largest PR agency",
    ],
  },
];

const skills = [
  "Marketplace Management",
  "E-commerce Strategy",
  "SEO & On-Page SEO",
  "PPC Advertising",
  "Content Strategy",
  "Data-Driven Decision Making",
  "A/B Testing & CRO",
  "People Management",
  "Growth Hacking",
  "UX / Interaction Design",
  "Agile Methodologies",
  "Inventory & Supply Chain",
  "Google Search Console",
  "WooCommerce",
  "Stakeholder Management",
];

const education = [
  {
    institution: "HU University of Applied Sciences Utrecht",
    degree: "B.A.Sc. Communication & Media Design",
    period: "2012 – 2016",
  },
  {
    institution: "ROC Hilversum",
    degree: "MBO – ICT Manager",
    period: "2007 – 2011",
  },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const About = () => (
  <section className="section-container pt-28 pb-20">
    <motion.div {...fadeIn}>
      {/* Header */}
      <div className="mb-16 grid gap-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted">
            <img
              src={hansProfile}
              alt="Hans van Leeuwen"
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>

        <div className="md:col-span-3">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">About</p>
          <h1 className="mb-6 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Hans van Leeuwen
          </h1>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              E-commerce Manager with 10+ years of experience accelerating digital commerce
              performance across marketplaces and D2C channels. Specializing in Amazon, Bol.com,
              and scalable revenue growth strategies.
            </p>
            <p>
              I combine a strong background in UX design with hands-on commercial expertise
              to create data-driven strategies that deliver measurable results. From achieving
              70% market share on Amazon NL to cutting out-of-stock rates below 2%, I turn
              complexity into growth.
            </p>
          </div>

          {/* Contact details */}
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-primary" /> Amersfoort, NL
            </span>
            <a href="mailto:hansvl3@gmail.com" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
              <Mail size={14} className="text-primary" /> hansvl3@gmail.com
            </a>
            <a href="https://linkedin.com/in/hansvl3" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
              <Linkedin size={14} className="text-primary" /> LinkedIn
            </a>
          </div>

          {/* Download CV */}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/Hans_CV_-_e-commerce_manager.pdf"
              download
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              <Download size={14} /> Download CV (EN)
            </a>
            <a
              href="/Cv_HvL_-_Ecommerce.pdf"
              download
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Download size={14} /> Download CV (NL)
            </a>
          </div>
        </div>
      </div>

      {/* Skills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-16"
      >
        <h2 className="mb-6 font-display text-2xl font-medium text-foreground">
          Core Competencies
        </h2>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="px-3 py-1.5 text-sm font-normal">
              {skill}
            </Badge>
          ))}
        </div>
      </motion.div>

      {/* Experience */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-16"
      >
        <h2 className="mb-8 font-display text-2xl font-medium text-foreground">
          <Briefcase size={20} className="mr-2 inline-block text-primary" />
          Experience
        </h2>
        <div className="space-y-0">
          {experience.map((job, i) => (
            <div
              key={job.company}
              className="relative border-l-2 border-border py-6 pl-8 first:pt-0 last:pb-0"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[7px] top-6 first:top-0 h-3 w-3 rounded-full border-2 border-primary bg-background" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-medium text-foreground">{job.role}</h3>
                  <p className="text-sm text-primary">{job.company}</p>
                </div>
                <span className="text-xs text-muted-foreground">{job.period}</span>
              </div>
              <ul className="mt-3 space-y-1">
                {job.highlights.map((h) => (
                  <li key={h} className="text-sm leading-relaxed text-muted-foreground">
                    · {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Education */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h2 className="mb-8 font-display text-2xl font-medium text-foreground">
          <GraduationCap size={20} className="mr-2 inline-block text-primary" />
          Education
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {education.map((edu) => (
            <div key={edu.institution} className="rounded-lg border border-border p-5">
              <h3 className="font-display text-base font-medium text-foreground">{edu.degree}</h3>
              <p className="mt-1 text-sm text-primary">{edu.institution}</p>
              <p className="mt-2 text-xs text-muted-foreground">{edu.period}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  </section>
);

export default About;
