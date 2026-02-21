import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Hero = () => (
  <section className="section-container flex min-h-[85vh] flex-col justify-center pt-28">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-3xl"
    >
      <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-primary">
        UX Designer · E-commerce Expert
      </p>
      <h1 className="mb-6 font-display text-4xl font-medium leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
        Designing digital experiences that{" "}
        <em className="text-primary">convert</em> &amp; delight.
      </h1>
      <p className="mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
        I'm Hans — a UX designer based in Amsterdam, specializing in e-commerce
        and AI-powered product experiences. I help businesses turn complexity
        into clarity.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link
          to="/work"
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-all duration-300 hover:gap-3"
        >
          View my work
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
        <Link
          to="/about"
          className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors duration-300 hover:bg-secondary"
        >
          About me
        </Link>
      </div>
    </motion.div>
  </section>
);

export default Hero;
