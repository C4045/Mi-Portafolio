"use client";

import { motion } from "framer-motion";
import { integrationIcons } from "@/lib/content";

export default function Integrations() {
  return (
    <section id="integrations" className="section-padding pt-0">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <div className="card-surface flex flex-col items-center gap-10 p-10 md:flex-row md:justify-between md:p-14">
          <div className="max-w-md text-center md:text-left">
            <p className="eyebrow">Integrations</p>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-[32px]">
              Works with the stack you already run
            </h3>
            <p className="mt-3 text-[15px] text-text-secondary">
              200+ native integrations mean no rip-and-replace — Arand-AI fits into
              your existing tools in minutes.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {integrationIcons.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-white/[0.03] transition-colors hover:border-primary/40"
              >
                <Icon className="h-5 w-5 text-accent" strokeWidth={2} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
