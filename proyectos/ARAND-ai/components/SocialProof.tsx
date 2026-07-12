import { socialProofLogos } from "@/lib/content";

export default function SocialProof() {
  const doubled = [...socialProofLogos, ...socialProofLogos];

  return (
    <section className="border-y border-border py-12">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <p className="mb-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-text-tertiary">
          Trusted by teams at
        </p>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
          <div className="flex w-max animate-marquee items-center gap-16">
            {doubled.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="whitespace-nowrap text-xl font-semibold tracking-tight text-text-tertiary grayscale transition-colors hover:text-text-secondary md:text-2xl"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
