import { motion } from "framer-motion";
import { Download, MapPin, Mail, Linkedin, Briefcase, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const experience = [
  {
    company: "Alpine Hearing Protection",
    role: "E-commerce Manager",
    period: "2022 – Present",
    highlights: [
      "Achieved 70% market share on Amazon NL & BE",
      "Expanded to 8 Amazon EU marketplaces",
      "Managed Amazon, Bol.com, and full webshop operations",
    ],
  },
  {
    company: "Webhelp / GGD",
    role: "Team Lead & Corona Communications",
    period: "2020 – 2022",
    highlights: [
      "Led a team managing public health communications",
      "Coordinated high-volume contact center operations",
    ],
  },
  {
    company: "IGM Badkamerwinkel",
    role: "Online Marketeer",
    period: "2018 – 2020",
    highlights: [
      "+40% organic traffic through SEO strategy",
      "+35% SEO visibility improvement",
      "Managed PPC campaigns and marketplace listings",
    ],
  },
  {
    company: "Intergamma (Gamma / Karwei)",
    role: "Interaction Designer",
    period: "2016 – 2018",
    highlights: [
      "Designed UX for e-commerce platform serving millions",
      "Created wireframes, prototypes, and user flows",
    ],
  },
];

const skills = [
  "Amazon & Bol Marketplaces",
  "SEO / PPC / SEM",
  "E-commerce Strategy",
  "Project Management",
  "Google Analytics",
  "UX / Interaction Design",
  "A/B Testing & CRO",
  "Team Leadership",
  "Content Strategy",
  "Data Analysis",
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
          <div className="aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br from-secondary to-muted">
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-display text-xl text-muted-foreground/30">Photo</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">About</p>
          <h1 className="mb-6 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Hans van Leeuwen
          </h1>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              Dynamic E-commerce Manager with 6+ years of experience in driving online sales,
              managing marketplace strategies, and optimizing digital channels. Specializing in
              Amazon, Bol.com, and full-stack e-commerce operations.
            </p>
            <p>
              I combine a strong background in interaction design with hands-on commercial
              expertise to create data-driven strategies that deliver measurable results.
              From achieving 70% market share on Amazon NL to boosting organic traffic by 40%,
              I'm passionate about turning complexity into growth.
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
