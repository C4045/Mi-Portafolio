"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Bell, Sparkles, TrendingUp, Users2, Zap } from "lucide-react";

const revenueData = [
  { name: "Mon", value: 32 },
  { name: "Tue", value: 41 },
  { name: "Wed", value: 38 },
  { name: "Thu", value: 52 },
  { name: "Fri", value: 49 },
  { name: "Sat", value: 63 },
  { name: "Sun", value: 71 },
];

const activityData = [
  { name: "W1", value: 24 },
  { name: "W2", value: 33 },
  { name: "W3", value: 29 },
  { name: "W4", value: 41 },
];

const notifications = [
  { icon: Sparkles, text: "AI reassigned 3 overdue tasks", time: "2m ago" },
  { icon: TrendingUp, text: "Revenue forecast updated for Q3", time: "18m ago" },
  { icon: Users2, text: "Design team hit sprint capacity", time: "1h ago" },
];

export default function DashboardShowcase() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Command center</p>
          <h2 className="mt-4 text-section-mobile font-bold tracking-tight text-white md:text-section">
            See everything, in real time
          </h2>
          <p className="mt-5 text-lg text-text-secondary">
            One dashboard for revenue, team activity, and the insights your AI
            surfaces along the way.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong mt-16 rounded-2xl border border-border p-3 shadow-card md:p-4"
        >
          <div className="rounded-xl bg-background/60 p-5 md:p-8">
            <div className="mb-6 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="ml-3 font-mono text-[11px] text-text-tertiary">
                app.flowtask.ai/dashboard
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Revenue", value: "$284,910", delta: "+12.4%" },
                    { label: "Active tasks", value: "1,204", delta: "+8.1%" },
                    { label: "Team activity", value: "97%", delta: "+3.2%" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-border bg-white/[0.02] p-4">
                      <p className="font-mono text-[10.5px] uppercase tracking-wider text-text-tertiary">
                        {m.label}
                      </p>
                      <p className="mt-2 text-xl font-bold text-white">{m.value}</p>
                      <p className="mt-1 text-[12px] font-medium text-emerald-400">{m.delta}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border bg-white/[0.02] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-white">Revenue this week</p>
                    <span className="font-mono text-[11px] text-text-tertiary">Live</span>
                  </div>
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748B", fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0F172A",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          labelStyle={{ color: "#94A3B8" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          fill="url(#revGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-white/[0.02] p-4">
                  <p className="mb-2 text-[13px] font-semibold text-white">Team activity by week</p>
                  <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748B", fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0F172A",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          labelStyle={{ color: "#94A3B8" }}
                        />
                        <Bar dataKey="value" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/30 bg-primary/[0.06] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-accent" />
                    <p className="text-[13px] font-semibold text-white">AI insight</p>
                  </div>
                  <p className="text-[13px] leading-relaxed text-text-secondary">
                    Design workload is trending 18% above capacity. Reassigning two
                    tasks to Ana would rebalance the sprint.
                  </p>
                  <button className="mt-3 text-[12.5px] font-semibold text-accent hover:underline">
                    Apply suggestion →
                  </button>
                </div>

                <div className="rounded-xl border border-border bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-text-secondary" />
                    <p className="text-[13px] font-semibold text-white">Notifications</p>
                  </div>
                  <div className="space-y-3">
                    {notifications.map(({ icon: Icon, text, time }) => (
                      <div key={text} className="flex items-start gap-2.5">
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <div>
                          <p className="text-[12.5px] leading-snug text-text-secondary">{text}</p>
                          <p className="mt-0.5 font-mono text-[10.5px] text-text-tertiary">{time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
