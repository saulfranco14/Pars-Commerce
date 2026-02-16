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
  },
  {
    icon: Globe,
    title: "Sitio web automatico",
    description:
      "Tu tienda publica se genera al instante. Cada negocio tiene su URL personalizada con colores y logo propios.",
  },
  {
    icon: ShoppingCart,
    title: "Ordenes y pedidos",
    description:
      "Recibe y gestiona pedidos en un solo lugar. Estado, historial, asignacion a equipo y seguimiento completo.",
  },
  {
    icon: CreditCard,
    title: "Checkout y pagos",
    description:
      "Carrito, checkout seguro y pagos con MercadoPago. Tus clientes compran con total confianza y seguridad.",
  },
] as const;

const SECONDARY_FEATURES = [
  {
    icon: BarChart3,
    title: "Ventas y reportes",
    description: "Metricas simples para entender como va tu negocio.",
  },
  {
    icon: Sparkles,
    title: "Promociones",
    description: "Crea ofertas y descuentos en fechas importantes.",
  },
  {
    icon: Users,
    title: "Equipo",
    description: "Invita colaboradores y asigna permisos de trabajo.",
  },
  {
    icon: Wrench,
    title: "Servicios",
    description: "Ofrece servicios ademas de productos fisicos.",
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="funciones" className="border-t border-border bg-surface/50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-accent" aria-hidden />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Todo lo que necesitas para vender
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Productos, sitio web, ordenes y pagos. Un sistema pensado para que
            empieces rapido.
          </p>
        </div>

        {/* Primary features - larger cards */}
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {PRIMARY_FEATURES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="group flex flex-col rounded-xl border border-border bg-surface p-8 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card hover:border-accent/20 cursor-default"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors duration-200 group-hover:bg-accent/15">
                <Icon className="h-7 w-7" aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ul>

        {/* Secondary features - compact cards */}
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECONDARY_FEATURES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card hover:border-accent/20 cursor-default"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors duration-200 group-hover:bg-accent/15">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
