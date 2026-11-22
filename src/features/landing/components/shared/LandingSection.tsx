import type { LandingSectionProps } from "@/features/landing/interfaces/landingSection";

const TONES = {
  base: "bg-background text-foreground",
  alt: "bg-surface text-foreground",
  dark: "bg-slate-950 text-white",
} as const;

/** Every home section shares one rhythm; the tone alternates instead of border lines. */
export function LandingSection({ id, tone = "base", width = "max-w-6xl", children }: LandingSectionProps) {
  return (
    <section id={id} className={`scroll-mt-20 py-20 sm:py-28 ${TONES[tone]}`}>
      <div className={`mx-auto ${width} px-4 sm:px-6 lg:px-8`}>{children}</div>
    </section>
  );
}
