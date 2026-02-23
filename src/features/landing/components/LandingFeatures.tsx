import {
  PRIMARY_FEATURES,
  SECONDARY_FEATURES,
} from "@/features/landing/constants/features";

export function LandingFeatures() {
  return (
    <section
      id="funciones"
      className="border-t border-border bg-surface/50 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-1 w-10 rounded-full bg-accent"
            aria-hidden
          />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Todo lo que necesitas para vender
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Productos, sitio web, ordenes y pagos. Un sistema pensado para que
            empieces rapido.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {PRIMARY_FEATURES.map(
            ({ icon: Icon, title, description, accent }) => (
              <li
                key={title}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card hover:border-border-soft cursor-default"
              >
                <div
                  className="absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl transition-all duration-300"
                  aria-hidden
                />

                <div className="relative">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent} transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ),
          )}
        </ul>

        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECONDARY_FEATURES.map(
            ({ icon: Icon, title, description, accent }) => (
              <li
                key={title}
                className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card hover:border-border-soft cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent} transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
