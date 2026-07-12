"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { pricingTiers } from "@/lib/content";

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="section-padding">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Pricing</p>
          <h2 className="mt-4 text-section-mobile font-bold tracking-tight text-white md:text-section">
            Simple pricing that scales with you
          </h2>
          <p className="mt-5 text-lg text-text-secondary">
            Start free. Upgrade when your team is ready for AI automation at scale.
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <span className={`text-[14px] font-medium ${!yearly ? "text-white" : "text-text-secondary"}`}>
            Monthly
          </span>
          <button
            role="switch"
            aria-checked={yearly}
            aria-label="Toggle yearly billing"
            onClick={() => setYearly((v) => !v)}
            className={`relative h-7 w-13 rounded-full border border-border-strong transition-colors ${
              yearly ? "bg-primary" : "bg-white/[0.06]"
            }`}
            style={{ width: "52px" }}
          >
            <motion.span
              layout
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white"
              animate={{ left: yearly ? "28px" : "4px" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-[14px] font-medium ${yearly ? "text-white" : "text-text-secondary"}`}>
            Yearly
          </span>
          <span className="rounded-full bg-accent/10 px-2.5 py-1 font-mono text-[11px] text-accent">
            Save 20%
          </span>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {pricingTiers.map((tier, i) => {
            const price = yearly ? tier.yearly : tier.monthly;
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`relative flex flex-col rounded-xl2 p-8 transition-all duration-300 ${
                  tier.highlighted
                    ? "glass-strong scale-100 border-2 border-primary/50 shadow-glow lg:scale-105"
                    : "card-surface hover:border-primary/30"
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-4 py-1 font-mono text-[11px] font-semibold text-white">
                    Most popular
                  </span>
                )}

                <h3 className="text-[18px] font-semibold text-white">{tier.name}</h3>
                <p className="mt-1.5 text-[13.5px] text-text-secondary">{tier.description}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  {price === null ? (
                    <span className="text-4xl font-bold tracking-tight text-white">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold tracking-tight text-white">${price}</span>
                      <span className="text-[14px] text-text-secondary">/month</span>
                    </>
                  )}
                </div>

                <a
                  href="#top"
                  className={`mt-7 rounded-full py-3 text-center text-[14.5px] font-semibold transition-all ${
                    tier.highlighted
                      ? "bg-gradient-primary text-white shadow-glow hover:scale-[1.02]"
                      : "border border-border-strong text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {tier.cta}
                </a>

                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13.5px] text-text-secondary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
