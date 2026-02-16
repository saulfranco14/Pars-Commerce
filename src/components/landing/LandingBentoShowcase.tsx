import { BarChart3, Palette, ClipboardList, ShoppingBag, CreditCard } from "lucide-react";

function BentoCell({
  children,
  className = "",
  title,
  description,
  icon: Icon,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-border bg-surface p-6 transition-colors duration-200 hover:border-accent/20 ${className}`}
    >
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

function MiniChart() {
  const bars = [35, 55, 40, 70, 50, 85, 65, 90, 55, 80, 70, 95];
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-end gap-1 h-24">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-accent/50 transition-all duration-200 group-hover:bg-accent/70"
            style={{ height: `${h}%` }}
            aria-hidden
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>Ene</span>
        <span>Jun</span>
        <span>Dic</span>
      </div>
    </div>
  );
}

function MiniColorSwatches() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["bg-rose-400", "bg-amber-400", "bg-emerald-400", "bg-blue-400", "bg-violet-400"].map((c) => (
          <div key={c} className={`h-8 flex-1 rounded-lg ${c}`} aria-hidden />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded bg-accent" aria-hidden />
        <div className="h-2 flex-1 rounded bg-border" aria-hidden />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded bg-foreground/20" aria-hidden />
        <div className="h-2 w-3/4 rounded bg-border" aria-hidden />
      </div>
    </div>
  );
}

function MiniOrderList() {
  const orders = [
    { id: "#001", status: "bg-emerald-500", label: "Completado", amount: "$450" },
    { id: "#002", status: "bg-amber-500", label: "En proceso", amount: "$120" },
    { id: "#003", status: "bg-blue-500", label: "Pendiente", amount: "$89" },
  ];
  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div
          key={o.id}
          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${o.status}`} aria-hidden />
            <span className="text-xs font-medium text-foreground">{o.id}</span>
            <span className="text-xs text-muted-foreground">{o.label}</span>
          </div>
          <span className="text-xs font-semibold text-foreground">{o.amount}</span>
        </div>
      ))}
    </div>
  );
}

function MiniProductCard() {
  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
        <ShoppingBag className="h-8 w-8 text-accent/40" aria-hidden />
      </div>
      <div>
        <div className="h-2 w-3/4 rounded bg-foreground/15" aria-hidden />
        <div className="mt-1.5 h-2 w-1/2 rounded bg-muted/30" aria-hidden />
        <div className="mt-2 text-sm font-bold text-foreground">$299.00</div>
      </div>
    </div>
  );
}

function MiniCheckout() {
  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-2">
        <div className="h-8 rounded-lg border border-border bg-background px-3 flex items-center">
          <span className="text-[10px] text-muted-foreground">nombre@email.com</span>
        </div>
        <div className="h-8 rounded-lg border border-border bg-background px-3 flex items-center">
          <span className="text-[10px] text-muted-foreground">**** **** **** 4242</span>
        </div>
        <div className="h-8 rounded-lg bg-accent flex items-center justify-center">
          <span className="text-[10px] font-semibold text-accent-foreground">Pagar $569.00</span>
        </div>
      </div>
      <div className="hidden w-32 space-y-1.5 sm:block">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">$520.00</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Envio</span>
          <span className="text-foreground">$49.00</span>
        </div>
        <div className="border-t border-border pt-1 flex justify-between text-[10px] font-bold">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">$569.00</span>
        </div>
      </div>
    </div>
  );
}

export function LandingBentoShowcase() {
  return (
    <section className="border-t border-border bg-surface/50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-accent" aria-hidden />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Una plataforma, todo tu negocio
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Desde tu catalogo hasta el cobro, todo integrado.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <BentoCell
            className="lg:col-span-2"
            title="Dashboard de ventas"
            description="Visualiza el rendimiento de tu negocio con graficos claros."
            icon={BarChart3}
          >
            <MiniChart />
          </BentoCell>

          <BentoCell
            title="Editor de sitio web"
            description="Personaliza colores y estilo de tu tienda."
            icon={Palette}
          >
            <MiniColorSwatches />
          </BentoCell>

          <BentoCell
            title="Gestion de ordenes"
            description="Seguimiento en tiempo real de cada pedido."
            icon={ClipboardList}
          >
            <MiniOrderList />
          </BentoCell>

          <BentoCell
            title="Catalogo inteligente"
            description="Productos con fotos, precios y categorias."
            icon={ShoppingBag}
          >
            <MiniProductCard />
          </BentoCell>

          <BentoCell
            className="md:col-span-2 lg:col-span-1"
            title="Checkout seguro"
            description="Pagos seguros con MercadoPago integrado."
            icon={CreditCard}
          >
            <MiniCheckout />
          </BentoCell>
        </div>
      </div>
    </section>
  );
}
