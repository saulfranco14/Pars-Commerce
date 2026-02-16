import {
  ArrowRight,
  ExternalLink,
  Tag,
  ShoppingBag,
  Percent,
  Eye,
} from "lucide-react";

function MockProductList() {
  const products = [
    {
      name: 'Laptop Pro 15"',
      price: "$899.00",
      stock: 12,
      img: "bg-blue-500/10",
    },
    {
      name: "Audifonos BT Max",
      price: "$45.00",
      stock: 38,
      img: "bg-emerald-500/10",
    },
    {
      name: "Teclado Mecanico",
      price: "$120.00",
      stock: 5,
      img: "bg-amber-500/10",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-3.5 w-3.5 text-accent" aria-hidden />
          <span className="text-xs font-semibold text-foreground">
            Mis productos
          </span>
        </div>
        <div className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
          + Agregar
        </div>
      </div>
      <div className="divide-y divide-border">
        {products.map((p) => (
          <div key={p.name} className="flex items-center gap-3 px-4 py-2.5">
            <div
              className={`h-9 w-9 shrink-0 rounded-lg ${p.img} flex items-center justify-center`}
            >
              <ShoppingBag
                className="h-4 w-4 text-muted-foreground/50"
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-foreground truncate">
                {p.name}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Stock: {p.stock}
              </div>
            </div>
            <div className="text-xs font-bold text-foreground">{p.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockPromotion() {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Percent className="h-3.5 w-3.5 text-accent" aria-hidden />
          <span className="text-xs font-semibold text-foreground">
            Promociones activas
          </span>
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
          <Tag className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-foreground">
              Verano 2026
            </div>
            <div className="text-[10px] text-muted-foreground">
              20% en toda la tienda
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Activa
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
          <Tag className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-foreground">
              2x1 Audifonos
            </div>
            <div className="text-[10px] text-muted-foreground">
              Compra 2, paga 1
            </div>
          </div>
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            Programada
          </span>
        </div>
      </div>
    </div>
  );
}

function MockStorefront() {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
      {/* Browser bar */}
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-red-400/70" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-yellow-400/70" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-green-400/70" aria-hidden />
        <div className="ml-2 flex flex-1 items-center gap-1.5 rounded-md bg-background border border-border px-2.5 py-1">
          <ExternalLink
            className="h-2.5 w-2.5 text-muted-foreground"
            aria-hidden
          />
          <span className="text-[10px] text-muted-foreground font-mono">
            tunegocio.pars.com
          </span>
        </div>
      </div>
      {/* Store content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-foreground">Mi Tienda</span>
          <div className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5">
            <Eye className="h-2.5 w-2.5 text-accent" aria-hidden />
            <span className="text-[10px] font-medium text-accent">
              142 visitas
            </span>
          </div>
        </div>
        {/* Promo banner */}
        <div className="rounded-lg from-accent/15 to-accent/5 p-2.5 mb-3">
          <div className="text-[10px] font-bold text-accent">
            Verano 2026 — 20% OFF
          </div>
          <div className="text-[9px] text-muted-foreground">
            En toda la tienda
          </div>
        </div>
        {/* Product grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              name: "Laptop Pro",
              price: "$899",
              sale: "$719",
              color: "bg-blue-500/10",
            },
            {
              name: "Audifonos BT",
              price: "$45",
              sale: "$36",
              color: "bg-emerald-500/10",
            },
          ].map((p) => (
            <div key={p.name} className="rounded-lg border border-border p-2">
              <div
                className={`aspect-square rounded-md ${p.color} mb-1.5 flex items-center justify-center`}
              >
                <ShoppingBag
                  className="h-5 w-5 text-muted-foreground/30"
                  aria-hidden
                />
              </div>
              <div className="text-[10px] font-medium text-foreground truncate">
                {p.name}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-accent">
                  {p.sale}
                </span>
                <span className="text-[9px] text-muted-foreground line-through">
                  {p.price}
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* Cart button */}
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-accent py-2">
          <ShoppingBag className="h-3 w-3 text-accent-foreground" aria-hidden />
          <span className="text-[10px] font-semibold text-accent-foreground">
            Ver carrito (2)
          </span>
        </div>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center py-4 lg:py-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface shadow-soft">
        <ArrowRight
          className="h-4 w-4 text-accent rotate-90 lg:rotate-0"
          aria-hidden
        />
      </div>
    </div>
  );
}

export function LandingShowflow() {
  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-1 w-10 rounded-full bg-accent"
            aria-hidden
          />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Publica, comparte y vende
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Da de alta tus productos y promociones desde el dashboard. Tu tienda
            se actualiza al instante y tus clientes compran solo visitando tu
            URL.
          </p>
        </div>

        {/* Flow: 3 columns on desktop, stacked on mobile */}
        <div className="mt-14 grid items-start gap-0 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {/* Step 1: Dashboard */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                1
              </span>
              <span className="text-sm font-semibold text-foreground">
                Administra desde tu dashboard
              </span>
            </div>
            <div className="space-y-3">
              <MockProductList />
              <MockPromotion />
            </div>
          </div>

          <FlowArrow />

          {/* Step 2: URL sharing */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                2
              </span>
              <span className="text-sm font-semibold text-foreground">
                Comparte tu enlace
              </span>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6 text-center shadow-card">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                <ExternalLink className="h-7 w-7 text-accent" aria-hidden />
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">
                Tu tienda esta siempre disponible
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5">
                <span className="text-sm font-mono font-medium text-accent">
                  tunegocio.pars.com
                </span>
              </div>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                Compartelo por WhatsApp, redes sociales, tarjeta de presentacion
                o donde quieras. Tus clientes ven productos y promociones
                actualizados en tiempo real.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {["WhatsApp", "Instagram", "Facebook", "Link directo"].map(
                  (ch) => (
                    <span
                      key={ch}
                      className="rounded-full border border-border bg-surface-raised px-3 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                      {ch}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>

          <FlowArrow />

          {/* Step 3: Customer buys */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                3
              </span>
              <span className="text-sm font-semibold text-foreground">
                Tus clientes compran
              </span>
            </div>
            <MockStorefront />
          </div>
        </div>
      </div>
    </section>
  );
}
