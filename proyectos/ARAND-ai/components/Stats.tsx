"use client";

import { motion } from "framer-motion";
import { stats } from "@/lib/content";
import AnimatedCounter from "./ui/AnimatedCounter";

export default function Stats() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <div className="card-surface grid grid-cols-2 gap-8 p-10 md:grid-cols-4 md:p-14">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  decimals={"decimals" in stat ? (stat as { decimals: number }).decimals : 0}
                />
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-text-tertiary md:text-xs">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
