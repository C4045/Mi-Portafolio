import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
    title: "Arand-AI — Your entire business, powered by AI",
  description:
    "Automate operations, manage projects, collaborate with teams, and gain powerful insights from a single intelligent platform.",
  keywords: ["AI automation", "project management", "workflow builder", "SaaS", "team collaboration"],
  openGraph: {
  title: "Arand-AI — Your entire business, powered by AI",
    description:
      "Automate operations, manage projects, collaborate with teams, and gain powerful insights from a single intelligent platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen overflow-x-hidden font-sans">{children}</body>
    </html>
  );
}
