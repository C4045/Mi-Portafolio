import {
  Bot,
  LineChart,
  Users,
  Workflow,
  Plug,
  Cloud,
  FileBarChart,
  ShieldCheck,
  Link2,
  Database,
  Sparkles,
  MessageSquare,
} from "lucide-react";

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Integrations", href: "#integrations" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export const trustIndicators = [
  "No credit card required",
  "Free 14-day trial",
  "SOC 2 Type II compliant",
];

export const socialProofLogos = [
  "Microsoft",
  "Spotify",
  "Airbnb",
  "Shopify",
  "Slack",
  "Stripe",
];

export const features = [
  {
    icon: Bot,
    title: "AI Task Automation",
    description:
      "Hand off repetitive work to an AI agent that understands your workflows and executes them without supervision.",
  },
  {
    icon: LineChart,
    title: "Predictive Analytics",
    description:
      "See bottlenecks and revenue shifts before they happen, with forecasts built from your team's own data.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Shared boards, live comments, and presence indicators keep every team aligned without extra meetings.",
  },
  {
    icon: Workflow,
    title: "Workflow Builder",
    description:
      "Drag, drop, and connect steps into automations that run themselves — no code, no engineering ticket.",
  },
  {
    icon: Plug,
    title: "Integrations",
    description:
      "Connect the tools you already run on: Slack, Notion, Salesforce, HubSpot, and 200+ more in a few clicks.",
  },
  {
    icon: Cloud,
    title: "Cloud Storage",
    description:
      "Every file, version, and comment lives in one secure workspace, synced instantly across your team.",
  },
  {
    icon: FileBarChart,
    title: "Smart Reports",
    description:
      "Weekly reports write themselves, pulling the metrics that matter into a summary leadership actually reads.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description:
      "SOC 2 Type II, SSO, and granular permissions come standard — built for teams that can't compromise.",
  },
];

export const integrationIcons = [
  { label: "Slack", icon: MessageSquare },
  { label: "Notion", icon: FileBarChart },
  { label: "Salesforce", icon: Database },
  { label: "Sheets", icon: LineChart },
  { label: "Drive", icon: Cloud },
  { label: "Zapier", icon: Link2 },
];

export const stats = [
  { value: 50000, suffix: "+", label: "Active users" },
  { value: 1.2, suffix: "M", label: "Tasks automated", decimals: 1 },
  { value: 99.99, suffix: "%", label: "Uptime", decimals: 2 },
  { value: 4.9, suffix: "/5", label: "Customer rating", decimals: 1 },
];

export const howItWorks = [
  {
    step: "01",
    title: "Connect your workspace",
    description:
      "Link the tools your team already uses. Arand-AI reads your existing structure — no migration required.",
  },
  {
    step: "02",
    title: "Import your data",
    description:
      "Projects, tasks, and history sync automatically, so your AI assistant starts with full context on day one.",
  },
  {
    step: "03",
    title: "Let AI optimize everything",
    description:
      "Arand-AI reassigns work, flags risk, and surfaces insights continuously — getting sharper the longer you use it.",
  },
];

export const testimonials = [
  {
    name: "Sarah Chen",
    role: "VP of Operations",
    company: "Northwind Logistics",
    avatar: "SC",
    quote:
      "Arand-AI replaced four separate tools for us. Our ops team now spends its time on decisions instead of status updates, and the AI catches scheduling conflicts before they cost us a client.",
  },
  {
    name: "Marcus Alden",
    role: "Head of Product",
    company: "Beacon Health",
    avatar: "MA",
    quote:
      "The workflow builder is the first automation tool our non-technical PMs actually adopted on their own. We shipped our onboarding automation in an afternoon, not a sprint.",
  },
  {
    name: "Priya Nair",
    role: "COO",
    company: "Fernweh Studio",
    avatar: "PN",
    quote:
      "Predictive analytics flagged a staffing gap three weeks out that would have slipped every deadline in Q3. That single alert paid for our annual plan twice over.",
  },
];

export const pricingTiers = [
  {
    name: "Starter",
    monthly: 0,
    yearly: 0,
    description: "For individuals getting organized.",
    features: [
      "Up to 3 projects",
      "Basic task automation",
      "1 GB cloud storage",
      "Community support",
      "Core integrations",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    monthly: 19,
    yearly: 15,
    description: "For growing teams that need AI on their side.",
    features: [
      "Unlimited projects",
      "Full AI task automation",
      "100 GB cloud storage",
      "Predictive analytics",
      "Priority support",
      "200+ integrations",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    monthly: null,
    yearly: null,
    description: "For organizations with custom needs.",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Dedicated success manager",
      "SSO & advanced permissions",
      "Custom SLAs",
      "On-premise options",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export const faqs = [
  {
    question: "What exactly does Arand-AI automate?",
    answer:
      "Arand-AI automates repetitive operational work: task assignment, status updates, follow-up reminders, report generation, and data entry across your connected tools. You define the workflow once; the AI executes it continuously.",
  },
  {
    question: "Do I need engineering resources to set it up?",
    answer:
      "No. The workflow builder is visual and designed for operations, product, and marketing teams to use directly. Most customers launch their first automation in under an hour.",
  },
  {
    question: "Which tools does Arand-AI integrate with?",
    answer:
      "Arand-AI connects to over 200 tools including Slack, Notion, Salesforce, HubSpot, Google Workspace, and Zapier, with new integrations added monthly.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. Arand-AI is SOC 2 Type II compliant, encrypts data in transit and at rest, and supports SSO with granular, role-based permissions on Enterprise plans.",
  },
  {
    question: "Can I cancel or change plans at any time?",
    answer:
      "Yes, you can upgrade, downgrade, or cancel your plan at any time from your billing settings. Downgrades and cancellations take effect at the end of your current billing cycle.",
  },
  {
    question: "Is there a free trial for the Pro plan?",
    answer:
      "Every new account gets a free 14-day trial of the Pro plan, no credit card required. You can also stay on the free Starter plan indefinitely.",
  },
  {
    question: "How does the AI get context on our business?",
    answer:
      "When you connect your tools, Arand-AI imports existing projects, tasks, and historical activity to build context immediately, then keeps learning from ongoing usage.",
  },
  {
    question: "Does Arand-AI work for non-technical teams?",
    answer:
      "Yes. Most of our customers are operations, marketing, and customer success teams with no engineering background. The interface is built for that audience first.",
  },
  {
    question: "What kind of support is included?",
    answer:
      "Starter includes community support, Pro includes priority live chat support with a same-business-day response, and Enterprise includes a dedicated customer success manager.",
  },
];

export const footerLinks = {
  Product: ["Features", "Integrations", "Pricing", "Changelog", "Roadmap"],
  Resources: ["Documentation", "API Reference", "Guides", "Blog", "Community"],
  Company: ["About", "Careers", "Customers", "Press", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Security", "Cookie Policy"],
};

export const socialLinks = ["Twitter", "LinkedIn", "GitHub", "YouTube"];

export { Sparkles };
