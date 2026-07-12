"use client";

import { motion } from "framer-motion";
import { features } from "@/lib/content";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function Features() {
  return (
    <section id="features" className="section-padding">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">What Arand-AI does</p>
          <h2 className="mt-4 text-section-mobile font-bold tracking-tight text-white md:text-section">
            One platform, every operation
          </h2>
          <p className="mt-5 text-lg text-text-secondary">
            Replace the six tools your team stitches together with one system that
            actually talks to itself.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={container}
          className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={item}
              className="card-surface group p-6 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-[17px] font-semibold text-white">{title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-text-secondary">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
