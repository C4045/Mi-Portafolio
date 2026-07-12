"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { testimonials } from "@/lib/content";

export default function Testimonials() {
  return (
    <section id="testimonials" className="section-padding">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Customer stories</p>
          <h2 className="mt-4 text-section-mobile font-bold tracking-tight text-white md:text-section">
            Teams run leaner with Arand-AI
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonials.map(({ name, role, company, avatar, quote }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="card-surface flex flex-col p-7"
            >
              <Quote className="h-6 w-6 text-primary/60" />
              <p className="mt-5 flex-1 text-[15px] leading-relaxed text-text-secondary">
                {quote}
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-[13px] font-semibold text-white">
                  {avatar}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">{name}</p>
                  <p className="text-[12.5px] text-text-secondary">
                    {role} · {company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
