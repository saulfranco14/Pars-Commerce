import { NOVEDADES } from "@/features/novedades/constants/catalog";

/**
 * What doesn't exist yet stays a short strip at the end: it shows the
 * product is moving without interrupting the reasons to sign up today.
 */
export function LandingComingSoon() {
  return (
    <section id="lo-que-viene" className="scroll-mt-20 bg-surface py-12 sm:py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-8 lg:px-8">
        <p className="shrink-0 text-center text-xs font-bold uppercase tracking-widest text-accent lg:text-left">
          Próximamente
        </p>
        <ul className="grid flex-1 gap-3 sm:grid-cols-2">
          {NOVEDADES.map(({ key, icon: Icon, title, highlight }) => (
            <li
              key={key}
              className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-foreground">{title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{highlight}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
