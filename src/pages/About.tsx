import { motion } from "framer-motion";
import { Download, MapPin, Mail, Linkedin, Briefcase, GraduationCap } from "lucide-react";
import hansProfile from "@/assets/hans-profile.jpg";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/components/Navbar";
import { translations } from "@/data/translations";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const About = () => {
  const { lang } = useLang();
  const t = translations[lang];

  return (
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
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">{t.about}</p>
            <h1 className="mb-6 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
              Hans van Leeuwen
            </h1>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>{t.bio[0]}</p>
              <p>{t.bio[1]}</p>
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
                <Download size={14} /> {t.downloadCvEn}
              </a>
              <a
                href="/Cv_HvL_-_Ecommerce.pdf"
                download
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <Download size={14} /> {t.downloadCvNl}
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
            {t.coreCompetencies}
          </h2>
          <div className="flex flex-wrap gap-2">
            {t.skills.map((skill) => (
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
            {t.experience}
          </h2>
          <div className="space-y-0">
            {t.experienceList.map((job, i) => (
              <div
                key={`${job.company}-${job.period}`}
                className="relative border-l-2 border-border py-6 pl-8 first:pt-0 last:pb-0"
              >
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
            {t.education}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {t.educationList.map((edu) => (
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
};

export default About;
