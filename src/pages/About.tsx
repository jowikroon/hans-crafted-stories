import { motion } from "framer-motion";

const About = () => (
  <section className="section-container pt-28">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="grid gap-16 md:grid-cols-5"
    >
      {/* Photo placeholder */}
      <div className="md:col-span-2">
        <div className="aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br from-secondary to-muted">
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-xl text-muted-foreground/30">Photo</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="md:col-span-3">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">About</p>
        <h1 className="mb-6 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
          Hans van Leeuwen
        </h1>
        <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            I'm a UX designer and e-commerce strategist based in Amsterdam with over 10 years
            of experience creating digital products that balance business goals with genuine
            user needs.
          </p>
          <p>
            My work sits at the intersection of design, technology, and commerce. I've helped
            startups find product-market fit and scaled design systems for enterprise teams.
            Currently, I'm exploring how AI can enhance — not replace — the human elements
            of shopping experiences.
          </p>
          <p>
            Before design, I studied cognitive psychology, which still shapes how I think about
            decision-making, attention, and motivation in digital interfaces.
          </p>
          <p>
            When I'm not designing, you'll find me cycling through the Dutch countryside,
            baking sourdough, or diving into a good book.
          </p>
        </div>

        {/* Details */}
        <div className="mt-10 grid grid-cols-2 gap-6">
          {[
            { label: "Location", value: "Amsterdam, NL" },
            { label: "Experience", value: "10+ years" },
            { label: "Focus", value: "E-commerce · AI · UX" },
            { label: "Education", value: "MSc Cognitive Psychology" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <a
            href="mailto:hans@example.com"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity duration-300 hover:opacity-80"
          >
            Get in touch
          </a>
        </div>
      </div>
    </motion.div>
  </section>
);

export default About;
