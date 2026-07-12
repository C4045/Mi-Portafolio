"use client";

import { motion } from "framer-motion";
import { howItWorks } from "@/lib/content";

export default function HowItWorks() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-4 text-section-mobile font-bold tracking-tight text-white md:text-section">
            Live in minutes, not sprints
          </h2>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          <div className="pointer-events-none absolute left-0 right-0 top-[42px] hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent md:block" />

          {howItWorks.map(({ step, title, description }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative"
            >
              <div className="card-surface p-7">
                <span className="font-mono text-sm text-primary">{step}</span>
                <h3 className="mt-4 text-[18px] font-semibold text-white">{title}</h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-text-secondary">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
