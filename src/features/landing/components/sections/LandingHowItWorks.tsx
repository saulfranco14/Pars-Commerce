import { STEPS } from "@/features/landing/constants/steps";

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 border-t border-border py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Vendes hoy mismo en tres pasos
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Sin instalar nada ni contratar a nadie.
          </p>
        </div>

        <ol className="mt-10 grid gap-3 sm:grid-cols-3 sm:gap-6">
          {STEPS.map(({ icon: Icon, step, title, description, detail }) => (
            <li
              key={step}
              className="flex gap-4 rounded-xl border border-border bg-surface-raised p-5 sm:flex-col sm:gap-0 sm:p-6"
            >
              <div className="relative h-12 w-12 shrink-0 sm:mx-auto sm:h-14 sm:w-14">
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
                </div>
                <span
                  className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground"
                  aria-hidden
                >
                  {step}
                </span>
              </div>
              <div className="min-w-0 sm:mt-4 sm:text-center">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
                <p className="mt-2 text-xs font-semibold text-accent">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
