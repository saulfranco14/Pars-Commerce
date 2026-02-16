import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

function DashboardMockup() {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" aria-hidden />
        <span className="ml-3 h-5 flex-1 rounded-md bg-border/50" aria-hidden />
      </div>
      {/* Dashboard content */}
      <div className="p-4 space-y-3">
        {/* Top metrics row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Ventas", value: "$12,450", color: "bg-accent/15" },
            { label: "Ordenes", value: "84", color: "bg-emerald-500/15" },
            { label: "Productos", value: "36", color: "bg-blue-500/15" },
          ].map((m) => (
            <div key={m.label} className={`rounded-lg ${m.color} p-2.5`}>
              <div className="text-[10px] text-muted-foreground">{m.label}</div>
              <div className="mt-0.5 text-sm font-bold text-foreground">{m.value}</div>
            </div>
          ))}
        </div>
        {/* Chart area */}
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="mb-2 text-[10px] font-medium text-muted-foreground">Ventas del mes</div>
          <div className="flex items-end gap-1 h-16">
            {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-accent/60"
                style={{ height: `${h}%` }}
                aria-hidden
              />
            ))}
          </div>
        </div>
        {/* Mini table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-3 gap-px bg-border text-[10px]">
            <div className="bg-surface-raised px-2 py-1.5 font-medium text-muted-foreground">Producto</div>
            <div className="bg-surface-raised px-2 py-1.5 font-medium text-muted-foreground">Estado</div>
            <div className="bg-surface-raised px-2 py-1.5 font-medium text-muted-foreground">Total</div>
            {[
              ["Laptop Pro", "Completado", "$899"],
              ["Audifonos BT", "En proceso", "$45"],
              ["Teclado MX", "Pendiente", "$120"],
            ].map(([name, status, total]) => (
              <Fragment key={name}>
                <div className="bg-surface px-2 py-1.5 text-foreground truncate">{name}</div>
                <div className="bg-surface px-2 py-1.5 text-muted-foreground">{status}</div>
                <div className="bg-surface px-2 py-1.5 font-medium text-foreground">{total}</div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle gradient glow */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-accent/[0.04] via-transparent to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Text content */}
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1.5 text-sm font-medium text-accent">
              <Package className="h-3.5 w-3.5" aria-hidden />
              Plataforma B2B para comercios
            </div>

            <h1 className="animate-fade-in-up animation-delay-100 mt-6 text-4xl font-bold tracking-tight leading-[1.1] text-foreground sm:text-5xl md:text-6xl">
              Tu negocio, tu tienda.{" "}
              <span className="text-accent">
                Todo en un solo lugar.
              </span>
            </h1>

            <p className="animate-fade-in-up animation-delay-200 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0 sm:text-xl">
              Gestiona productos, ordenes y ventas. Genera tu sitio web automatico
              y recibe pagos. Diseñado para negocios que quieren vender online sin
              complicaciones.
            </p>

            <div className="animate-fade-in-up animation-delay-300 mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
              <Link
                href="/registro"
                className="group inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3 text-base font-semibold text-accent-foreground transition-colors duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
              >
                Crear cuenta gratis
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-6 py-3 text-base font-medium text-foreground transition-colors duration-200 hover:bg-border-soft/50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
              >
                Ya tengo cuenta
              </Link>
            </div>

            {/* Social proof */}
            <div className="animate-fade-in-up animation-delay-400 mt-10 flex items-center justify-center gap-3 lg:justify-start">
              <div className="flex -space-x-2">
                {["P", "M", "S", "L"].map((initial, i) => (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-accent/15 text-xs font-semibold text-accent"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">+50 negocios</span> ya confian en Pars Commerce
              </p>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="animate-fade-in-up animation-delay-300 mt-12 lg:mt-0">
            <div className="mx-auto max-w-lg lg:max-w-none">
              <div className="rotate-1 transition-transform duration-500 hover:rotate-0 lg:rotate-2">
                <DashboardMockup />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
