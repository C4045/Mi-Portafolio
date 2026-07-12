"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-xl2 bg-gradient-primary p-12 text-center shadow-glow md:p-20"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 40%)",
            }}
          />
          <div className="relative">
            <h2 className="text-section-mobile font-bold tracking-tight text-white md:text-section">
              Ready to scale with AI?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/85">
              Join thousands of teams already transforming their workflow.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#top"
                className="group inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-[16px] font-semibold text-background transition-transform hover:scale-[1.03]"
              >
                Start Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 text-[16px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Sales
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
