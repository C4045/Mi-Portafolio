# FlowTask AI — Landing Page

A premium, conversion-focused SaaS landing page built with Next.js 15, TypeScript,
Tailwind CSS, and Framer Motion.

## Stack

- **Next.js 15** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS** with a custom design token system
- **Framer Motion** for scroll-triggered and micro-interaction animations
- **Recharts** for the dashboard showcase charts
- **Lucide React** for icons

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  layout.tsx        Root layout, fonts, metadata
  page.tsx           Assembles all landing page sections
  globals.css        Design tokens, base styles, glass utilities
components/
  Navbar.tsx
  Hero.tsx
  HeroFlowVisual.tsx Signature animated "flow graph" hero visual
  SocialProof.tsx
  Features.tsx
  Integrations.tsx
  DashboardShowcase.tsx
  Benefits.tsx
  HowItWorks.tsx
  Stats.tsx
  Testimonials.tsx
  Pricing.tsx
  FAQ.tsx
  FinalCTA.tsx
  Footer.tsx
  ui/AnimatedCounter.tsx
lib/
  content.ts         All copy and structured content in one place
  utils.ts           cn() class-merging helper
```

## Design system

| Token | Value |
|---|---|
| Background | `#070B14` |
| Surface | `#0F172A` |
| Primary | `#6366F1` |
| Secondary | `#8B5CF6` |
| Accent | `#22D3EE` |
| Text primary | `#FFFFFF` |
| Text secondary | `#94A3B8` |
| Border | `rgba(255,255,255,0.08)` |

Fonts: **Inter** (display/body) + **JetBrains Mono** (eyebrows, labels, data).

The signature visual is the hero's animated flow graph: connected tool nodes
(Slack, Email, Sheets, CRM) feed into a central pulsing AI orb, which fans out
into live task/report/risk cards — a literal picture of "your entire business,
powered by AI" rather than a generic dashboard screenshot.

## Notes

- All copy in `lib/content.ts` is placeholder marketing content for a fictional
  product and safe to edit freely.
- Company logos in the social proof strip are rendered as styled text, not
  actual brand marks, to avoid using real trademarked logos.
- Respects `prefers-reduced-motion` and includes visible focus states throughout.
