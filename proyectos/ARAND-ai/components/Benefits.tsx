"use client";

import { motion } from "framer-motion";
import { Clock, TrendingUp, DollarSign, Brain } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Save time",
    stat: "12 hrs",
    statLabel: "saved per person, weekly",
    description:
      "Status updates, follow-ups, and repetitive data entry run themselves, so your team spends time on the work only they can do.",
  },
  {
    icon: TrendingUp,
    title: "Increase productivity",
    stat: "34%",
    statLabel: "more tasks shipped per sprint",
    description:
      "Automated handoffs and AI-prioritized queues remove the friction between finishing one task and starting the next.",
  },
  {
    icon: DollarSign,
    title: "Reduce costs",
    stat: "$41K",
    statLabel: "average annual tool savings",
    description:
      "Consolidate five or six point solutions into one platform and stop paying for overlapping subscriptions.",
  },
  {
    icon: Brain,
    title: "Better decisions",
    stat: "3 wks",
    statLabel: "earlier risk detection",
    description:
      "Predictive analytics surface the pattern in your data before it becomes a missed deadline or a lost account.",
  },
];

export default function Benefits() {
  return (
    <section className="section-padding">
      <div className="mx-auto grid max-w-content grid-cols-1 gap-16 px-6 md:px-10 lg:grid-cols-2 lg:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="lg:sticky lg:top-32 lg:self-start"
        >
          <p className="eyebrow">Why teams switch</p>
          <h2 className="mt-4 text-section-mobile font-bold tracking-tight text-white md:text-section">
            Built to be felt in the numbers
          </h2>
          <p className="mt-5 max-w-md text-lg text-text-secondary">
            Arand-AI isn&apos;t another dashboard to check. It&apos;s the layer that
            quietly removes the busywork sitting between your team and its goals —
            and the results show up in the metrics leadership already tracks.
          </p>
          <a href="#pricing" className="btn-primary mt-8 inline-flex">
            See it on your data
          </a>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {benefits.map(({ icon: Icon, title, stat, statLabel, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="card-surface p-6"
            >
              <Icon className="h-5 w-5 text-accent" strokeWidth={2} />
              <p className="mt-4 text-2xl font-bold tracking-tight text-white">{stat}</p>
              <p className="font-mono text-[11px] uppercase tracking-wide text-text-tertiary">
                {statLabel}
              </p>
              <h3 className="mt-4 text-[15px] font-semibold text-white">{title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-text-secondary">
                {description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
