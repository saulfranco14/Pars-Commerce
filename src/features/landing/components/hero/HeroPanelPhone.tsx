import {
  Banknote,
  Bell,
  ClipboardList,
  Clock,
  Home,
  MoreHorizontal,
  Package,
} from "lucide-react";

import { PhoneShell } from "@/features/landing/components/hero/phone/PhoneParts";

import type { HeroBeat, HeroPanelData, HeroPanelView } from "@/features/landing/interfaces/heroDemo";

/** Igual que `BottomNav` del dashboard real en móvil. */
const NAV = [
  { key: "home", label: "Inicio", icon: Home },
  { key: "orders", label: "Órdenes", icon: ClipboardList },
  { key: "products", label: "Productos", icon: Package },
  { key: "money", label: "Dinero", icon: Banknote },
  { key: "more", label: "Más", icon: MoreHorizontal },
] as const;

const ACTIVE_TAB: Record<HeroPanelView, (typeof NAV)[number]["key"]> = {
  tables: "orders",
  orders: "orders",
  subscriptions: "home",
  loans: "home",
  site: "products",
  money: "money",
};

/**
 * El panel del negocio tal como se ve en el celular del dueño: la mayoría lo
 * va a operar desde ahí, así que la demo lo muestra así y no como ventana.
 */
export function HeroPanelPhone({ beat, panel }: { beat: HeroBeat; panel: HeroPanelData }) {
  const NoticeIcon = panel.notice.idle ? Clock : Bell;
  const activeTab = ACTIVE_TAB[beat.panel.view];

  return (
    <PhoneShell>
      <div className="flex h-100 flex-col bg-background">
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[9px] font-semibold text-muted-foreground">Mi Negocio</p>
            <p key={beat.panel.title} className="animate-fade-in-up truncate text-sm font-bold leading-tight text-foreground">
              {beat.panel.title}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5">
            <span className="animate-hero-live-pulse h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">En vivo</span>
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 p-2.5">
          <div
            key={panel.notice.text}
            className={`animate-hero-row-in flex items-start gap-2 rounded-xl border px-2.5 py-2 shadow-card ${
              panel.notice.idle
                ? "border-border bg-surface text-muted-foreground"
                : "border-accent/30 bg-surface text-foreground"
            }`}
          >
            <span
              className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                panel.notice.idle ? "bg-border-soft dark:bg-border" : "bg-accent text-accent-foreground"
              }`}
            >
              <NoticeIcon className="h-3 w-3" aria-hidden />
            </span>
            <span className="min-w-0 text-[10px] font-semibold leading-snug">{panel.notice.text}</span>
          </div>

          <div key={beat.panel.view} className="animate-fade-in-up grid grid-cols-3 gap-1.5">
            {panel.metrics.map((m) => (
              <div key={m.label} className="min-w-0 rounded-lg border border-border bg-surface px-1.5 py-1.5">
                <p className="text-[8.5px] font-medium leading-tight text-muted-foreground">{m.label}</p>
                <p key={m.value} className="animate-hero-row-in truncate text-[11px] font-bold tabular-nums text-foreground">
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          <ul className="flex flex-col gap-1.5">
            {panel.rows.map((row) => (
              <li
                key={row.left}
                className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 ${
                  row.highlight ? "border-accent/40 bg-accent/8" : "border-border bg-surface"
                }`}
              >
                <span className="min-w-0 truncate text-[10px] font-semibold text-foreground">{row.left}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span
                    key={row.middle}
                    className={`rounded-full px-1.5 py-0.5 text-[8.5px] font-bold ${
                      row.highlight
                        ? "animate-hero-row-in bg-accent text-accent-foreground"
                        : "bg-border-soft text-muted-foreground dark:bg-border"
                    }`}
                  >
                    {row.middle}
                  </span>
                  <span key={row.right} className="text-[10px] font-bold tabular-nums text-foreground">
                    {row.right}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <nav className="grid shrink-0 grid-cols-5 border-t border-border bg-surface px-1 pb-2 pt-1.5" aria-hidden>
          {NAV.map(({ key, label, icon: Icon }) => (
            <span
              key={key}
              className={`flex flex-col items-center gap-0.5 text-[8px] font-semibold ${
                key === activeTab ? "text-accent" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          ))}
        </nav>
      </div>
    </PhoneShell>
  );
}
