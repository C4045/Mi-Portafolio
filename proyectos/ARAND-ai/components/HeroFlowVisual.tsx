"use client";

import { motion } from "framer-motion";
import { MessageSquare, Mail, FileSpreadsheet, Database, Sparkles, CheckCircle2 } from "lucide-react";

const sources = [
  { icon: MessageSquare, label: "Slack", top: "6%", left: "2%", delay: 0 },
  { icon: Mail, label: "Email", top: "38%", left: "-2%", delay: 0.15 },
  { icon: FileSpreadsheet, label: "Sheets", top: "70%", left: "4%", delay: 0.3 },
  { icon: Database, label: "CRM", top: "88%", left: "34%", delay: 0.45 },
];

const outputs = [
  { label: "Task assigned", sub: "Onboarding · Ana R.", delay: 0.9 },
  { label: "Report generated", sub: "Weekly ops summary", delay: 1.05 },
  { label: "Risk flagged", sub: "Renewal at risk · Acme Co.", delay: 1.2 },
];

export default function HeroFlowVisual() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[880px] md:h-[480px]">
      <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[100px]" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 880 480"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        {[
          "M 90 40 C 260 40, 300 220, 430 240",
          "M 60 180 C 220 180, 300 220, 430 240",
          "M 90 340 C 250 340, 320 260, 430 240",
          "M 260 430 C 330 400, 370 300, 430 240",
        ].map((d, i) => (
          <motion.path
            key={i}
            d={d}
            stroke="url(#lineGradient)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: "easeInOut" }}
          />
        ))}
        {[
          "M 460 240 C 540 200, 600 160, 700 110",
          "M 460 245 C 560 245, 620 245, 700 245",
          "M 460 255 C 540 300, 600 340, 700 380",
        ].map((d, i) => (
          <motion.path
            key={`out-${i}`}
            d={d}
            stroke="url(#lineGradientOut)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 1, delay: 0.9 + i * 0.15, ease: "easeInOut" }}
          />
        ))}
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="lineGradientOut" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
      {sources.map(({ icon: Icon, label, top, left, delay }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay }}
          style={{ top, left }}
          className="glass absolute flex items-center gap-2 rounded-full px-3.5 py-2 shadow-card"
        >
          <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
          <span className="font-mono text-[11px] text-text-secondary">{label}</span>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-primary shadow-glow md:h-28 md:w-28">
          <div className="absolute inset-0 animate-pulse-glow rounded-full bg-gradient-primary blur-xl" />
          <Sparkles className="relative h-9 w-9 text-white md:h-10 md:w-10" strokeWidth={1.75} />
          <div className="absolute -inset-3 rounded-full border border-white/10" />
          <div className="absolute -inset-6 animate-spin-slow rounded-full border border-dashed border-white/[0.08]" />
        </div>
      </motion.div>
      {outputs.map(({ label, sub, delay }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay }}
          style={{ top: `${8 + i * 34}%`, right: "0%" }}
          className="glass absolute w-[190px] rounded-xl border border-border p-3 shadow-card md:w-[210px]"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
            <div>
              <p className="text-[12.5px] font-medium leading-tight text-white">{label}</p>
              <p className="mt-0.5 font-mono text-[10.5px] text-text-secondary">{sub}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
