import { Sparkles, Twitter, Linkedin, Github, Youtube } from "lucide-react";
import { footerLinks, socialLinks } from "@/lib/content";

const socialIcons: Record<string, typeof Twitter> = {
  Twitter,
  LinkedIn: Linkedin,
  GitHub: Github,
  YouTube: Youtube,
};

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-content px-6 py-16 md:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <a href="#top" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-[17px] font-semibold tracking-tight text-white">
                Arand-AI
              </span>
            </a>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-text-secondary">
              Your entire business, powered by AI. Automate operations and gain
              insights from a single intelligent platform.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((label) => {
                const Icon = socialIcons[label];
                return (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-primary/40 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <p className="font-mono text-[11px] uppercase tracking-wide text-text-tertiary">
                {heading}
              </p>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[13.5px] text-text-secondary transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-[13px] text-text-tertiary">
            © {new Date().getFullYear()} Arand-AI, Inc. All rights reserved.
          </p>
          <p className="font-mono text-[12px] text-text-tertiary">
            Made for teams who&apos;d rather build than babysit tools.
          </p>
        </div>
      </div>
    </footer>
  );
}
