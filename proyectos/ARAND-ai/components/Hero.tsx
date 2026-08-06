"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import { trustIndicators } from "@/lib/content";
import HeroFlowVisual from "./HeroFlowVisual";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-10 pt-40 md:pb-16 md:pt-48">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-radial-glow" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, black 40%, transparent 80%)",
        }}
      />

      <div className="mx-auto max-w-content px-6 text-center md:px-10">
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.03] px-4 py-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Now with autonomous AI agents
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          custom={0.1}
          variants={fadeUp}
          className="text-hero-mobile font-bold tracking-tight text-white md:text-hero"
        >
          Your entire business.
          <br />
          <span className="text-gradient-brand">Powered by AI.</span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          custom={0.2}
          variants={fadeUp}
          className="mx-auto mt-7 max-w-2xl text-lg text-text-secondary md:text-xl"
        >
          Automate operations, manage projects, collaborate with teams, and gain
          powerful insights from a single intelligent platform.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.3}
          variants={fadeUp}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a href="#pricing" className="btn-primary group">
            Start Free
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a href="#demo" className="btn-secondary group">
            <PlayCircle className="mr-2 h-4 w-4" />
            Book a Demo
          </a>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.4}
          variants={fadeUp}
          className="mt-8 flex flex-col items-center justify-center gap-x-6 gap-y-2 text-sm text-text-secondary sm:flex-row"
        >
          {trustIndicators.map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-16 px-4 md:mt-20"
      >
        <HeroFlowVisual />
      </motion.div>
    </section>
  );
}
