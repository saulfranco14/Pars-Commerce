import { Clock, CreditCard, Zap, TrendingUp } from "lucide-react";

const STATS = [
  {
    icon: Zap,
    value: "5 min",
    label: "para crear tu tienda",
    accent: "bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400",
  },
  {
    icon: CreditCard,
    value: "MercadoPago",
    label: "pagos integrados",
    accent: "bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400",
  },
  {
    icon: Clock,
    value: "24/7",
    label: "tu tienda siempre abierta",
    accent: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400",
  },
  {
    icon: TrendingUp,
    value: "$0",
    label: "comision de plataforma",
    accent: "bg-rose-500/10 text-rose-500 dark:bg-rose-400/10 dark:text-rose-400",
  },
] as const;

export function LandingLogos() {
  return (
    <section className="border-t border-border py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label, accent }) => (
            <div
              key={value}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 transition-all duration-200 hover:shadow-soft hover:border-border-soft cursor-default"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{value}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
