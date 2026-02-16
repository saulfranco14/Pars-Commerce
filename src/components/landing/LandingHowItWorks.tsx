import { UserPlus, Store, Zap } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    step: 1,
    title: "Registrate",
    description: "Crea tu cuenta en segundos. Sin tarjeta para empezar.",
    detail: "30 segundos",
  },
  {
    icon: Store,
    step: 2,
    title: "Crea tu negocio",
    description: "Dale nombre, slug y tipo. Tu sitio estara listo al instante.",
    detail: "tutienda.pars.com",
  },
  {
    icon: Zap,
    step: 3,
    title: "Empieza a vender",
    description: "Agrega productos, configura promociones y comparte tu tienda.",
    detail: "Sin comision de plataforma",
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-accent" aria-hidden />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tres pasos para comenzar
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Sin configuraciones complejas. En minutos tendras tu tienda en linea.
          </p>
        </div>

        <div className="relative mt-12 grid gap-8 sm:grid-cols-3">
          {/* Connecting dashed line (desktop only) */}
          <div
            className="absolute top-[60px] left-[16.67%] right-[16.67%] hidden border-t border-dashed border-border sm:block"
            aria-hidden
          />

          {STEPS.map(({ icon: Icon, step, title, description, detail }) => (
            <div
              key={step}
              className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface-raised p-6 text-center"
            >
              {/* Watermark number */}
              <span
                className="absolute top-3 right-4 text-5xl font-bold text-accent/[0.07] select-none"
                aria-hidden
              >
                {step}
              </span>

              <div className="relative mx-auto">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-7 w-7" aria-hidden />
                </div>
                <span
                  className="absolute -top-1.5 -left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground"
                  aria-hidden
                >
                  {step}
                </span>
              </div>

              <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              <p className="mt-3 text-xs font-medium font-mono text-accent">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
