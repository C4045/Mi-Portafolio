import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#070B14",
        surface: "#0F172A",
        "surface-raised": "#141E33",
        primary: {
          DEFAULT: "#6366F1",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#8B5CF6",
        },
        accent: {
          DEFAULT: "#22D3EE",
        },
        "text-primary": "#FFFFFF",
        "text-secondary": "#94A3B8",
        "text-tertiary": "#64748B",
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "hero-mobile": ["44px", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        hero: ["96px", { lineHeight: "1.02", letterSpacing: "-0.04em" }],
        "section-mobile": ["32px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        section: ["56px", { lineHeight: "1.08", letterSpacing: "-0.03em" }],
      },
      maxWidth: {
        shell: "1440px",
        content: "1280px",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
        "gradient-accent": "linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%)",
        "gradient-radial-glow":
          "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0) 60%)",
        "grid-pattern":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      boxShadow: {
        glow: "0 0 80px -20px rgba(99,102,241,0.5)",
        "glow-cyan": "0 0 60px -15px rgba(34,211,238,0.45)",
        card: "0 4px 24px -8px rgba(0,0,0,0.4)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "spin-slow": "spin 20s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        "flow-dash": "flow-dash 1.5s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "flow-dash": {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
