"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import { navLinks } from "@/lib/content";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div
        className={`mx-auto flex max-w-shell items-center justify-between rounded-2xl px-6 transition-all duration-300 md:px-8 ${
          scrolled ? "glass-strong mx-4 shadow-card" : "bg-transparent"
        }`}
      >
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-white">
            Arand-AI
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] font-medium text-text-secondary transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="#login"
            className="text-[14px] font-medium text-text-secondary transition-colors hover:text-white"
          >
            Login
          </a>
          <a
            href="#pricing"
            className="rounded-full bg-gradient-primary px-5 py-2.5 text-[14px] font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
          >
            Start Free
          </a>
        </div>

        <button
          aria-label="Toggle menu"
          className="p-2 text-white lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="glass-strong mx-4 mt-3 rounded-2xl p-6 lg:hidden"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[15px] font-medium text-text-secondary hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4">
                <a href="#login" className="text-[15px] font-medium text-text-secondary hover:text-white">
                  Login
                </a>
                <a
                  href="#pricing"
                  className="rounded-full bg-gradient-primary px-5 py-3 text-center text-[15px] font-semibold text-white"
                >
                  Start Free
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
