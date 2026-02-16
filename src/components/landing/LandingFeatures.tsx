import {
  Package,
  ShoppingCart,
  Globe,
  CreditCard,
  Sparkles,
  Users,
  Wrench,
  BarChart3,
} from "lucide-react";

const PRIMARY_FEATURES = [
  {
    icon: Package,
    title: "Catalogo de productos",
    description:
      "Agrega y organiza tu inventario con fotos, precios, descripciones y subcategorias. Todo centralizado para que gestiones tu oferta facilmente.",
    accent:
      "bg-rose-500/10 text-rose-500 dark:bg-rose-400/10 dark:text-rose-400",
  },
  {
    icon: Globe,
    title: "Sitio web automatico",
    description:
      "Tu tienda publica se genera al instante. Cada negocio tiene su URL personalizada con colores y logo propios.",
    accent:
      "bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400",
  },
  {
    icon: ShoppingCart,
    title: "Ordenes y pedidos",
    description:
      "Recibe y gestiona pedidos en un solo lugar. Estado, historial, asignacion a equipo y seguimiento completo.",
    accent:
      "bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400",
  },
  {
    icon: CreditCard,
    title: "Checkout y pagos",
    description:
      "Carrito, checkout seguro y pagos con MercadoPago. Tus clientes compran con total confianza y seguridad.",
    accent:
      "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400",
  },
] as const;

const SECONDARY_FEATURES = [
  {
    icon: BarChart3,
    title: "Ventas y reportes",
    description: "Metricas simples para entender como va tu negocio.",
    accent:
      "bg-violet-500/10 text-violet-500 dark:bg-violet-400/10 dark:text-violet-400",
  },
  {
    icon: Sparkles,
    title: "Promociones",
    description: "Crea ofertas y descuentos en fechas importantes.",
    accent:
      "bg-pink-500/10 text-pink-500 dark:bg-pink-400/10 dark:text-pink-400",
  },
  {
    icon: Users,
    title: "Equipo",
    description: "Invita colaboradores y asigna permisos de trabajo.",
    accent:
      "bg-cyan-500/10 text-cyan-500 dark:bg-cyan-400/10 dark:text-cyan-400",
  },
  {
    icon: Wrench,
    title: "Servicios",
    description: "Ofrece servicios ademas de productos fisicos.",
    accent:
      "bg-orange-500/10 text-orange-500 dark:bg-orange-400/10 dark:text-orange-400",
  },
] as const;

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

        {/* Primary features - larger cards */}
        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {PRIMARY_FEATURES.map(
            ({ icon: Icon, title, description, accent }) => (
              <li
                key={title}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card hover:border-border-soft cursor-default"
              >
                {/* Subtle gradient corner */}
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

        {/* Secondary features - compact row */}
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
