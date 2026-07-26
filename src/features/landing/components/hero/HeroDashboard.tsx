import {
  Banknote,
  BarChart3,
  Bell,
  Globe,
  Repeat,
  Table2,
  Wallet,
} from "lucide-react";

import type { HeroBeat, HeroPanelView } from "@/features/landing/constants/heroDemo";

/**
 * La mitad del negocio en la demo del hero — el lado que la competencia nunca
 * muestra. Cambia de MÓDULO junto con el beat (mesas, órdenes, suscripciones,
 * préstamos, sitio web, mi dinero) para que se vea que es una plataforma
 * completa y no una sola función.
 */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-2.5 py-2">
      <p className="truncate text-[10px] font-medium text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

/**
 * Fila de tabla del panel. La fila `highlight` es la que acaba de cambiar por
 * la acción del cliente: se marca con tinte de acento SÓLIDO y borde izquierdo
 * — con una opacidad muy baja el tinte se lee gris y parece un bug.
 */
function Row({
  left,
  middle,
  right,
  highlight = false,
}: {
  left: string;
  middle: string;
  right: string;
  highlight?: boolean;
}) {
  const bg = highlight ? "bg-accent/10" : "bg-surface";
  return (
    <>
      <div
        className={`${bg} relative px-2.5 py-2 text-[11px] font-semibold text-foreground`}
      >
        {highlight && (
          <span
            className="absolute inset-y-0 left-0 w-0.5 bg-accent"
            aria-hidden
          />
        )}
        {left}
      </div>
      <div className={`${bg} px-2.5 py-2`}>
        <span
          className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${
            highlight
              ? "bg-accent text-accent-foreground"
              : "bg-border-soft text-muted-foreground dark:bg-border"
          }`}
        >
          {middle}
        </span>
      </div>
      <div
        className={`${bg} px-2.5 py-2 text-right text-[11px] font-bold tabular-nums text-foreground`}
      >
        {right}
      </div>
    </>
  );
}

function Table({
  headers,
  children,
}: {
  headers: [string, string, string];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[1fr_auto_auto] gap-px bg-border">
        {headers.map((h, i) => (
          <div
            key={h}
            className={`bg-surface-raised px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground ${
              i === 2 ? "text-right" : ""
            }`}
          >
            {h}
          </div>
        ))}
        {children}
      </div>
    </div>
  );
}

/** Contenido por módulo. Cada uno refleja una pantalla real del dashboard. */
const PANELS: Record<HeroPanelView, () => React.JSX.Element> = {
  tables: () => (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Ventas de hoy" value="$12,450" />
        <Metric label="Mesas activas" value="3" />
        <Metric label="Por cobrar" value="$284" />
      </div>
      <Table headers={["Mesa", "Estado", "Total"]}>
        <Row left="Mesa 4" middle="Recibido" right="$284.00" highlight />
        <Row left="Mesa 2" middle="Pagado" right="$156.00" />
        <Row left="Mesa 7" middle="Pagado" right="$92.00" />
      </Table>
    </>
  ),
  orders: () => (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Órdenes hoy" value="85" />
        <Metric label="En proceso" value="4" />
        <Metric label="Listas" value="12" />
      </div>
      <Table headers={["Orden", "Estado", "Total"]}>
        <Row left="#1042 · Mesa 4" middle="Listo" right="$284.00" highlight />
        <Row left="#1041 · Mostrador" middle="En proceso" right="$210.00" />
        <Row left="#1040 · Mesa 2" middle="Pagado" right="$156.00" />
      </Table>
    </>
  ),
  subscriptions: () => (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Activas" value="18" />
        <Metric label="Cobro al mes" value="$9,400" />
        <Metric label="Próx. cargo" value="3 días" />
      </div>
      <Table headers={["Cliente", "Plan", "Cuota"]}>
        <Row left="Ana Ríos" middle="3 pagos" right="$400.00" highlight />
        <Row left="Luis Mena" middle="6 pagos" right="$200.00" />
        <Row left="Sofía Cruz" middle="Mensual" right="$350.00" />
      </Table>
    </>
  ),
  loans: () => (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Prestado" value="$48,000" />
        <Metric label="Por cobrar" value="$21,500" />
        <Metric label="Al corriente" value="92%" />
      </div>
      <Table headers={["Cliente", "Abono", "Monto"]}>
        <Row left="Ana Ríos" middle="3 de 6" right="$500.00" highlight />
        <Row left="Luis Mena" middle="5 de 6" right="$300.00" />
        <Row left="Sofía Cruz" middle="1 de 4" right="$900.00" />
      </Table>
    </>
  ),
  site: () => (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Visitas hoy" value="248" />
        <Metric label="Pedidos web" value="9" />
        <Metric label="Ticket prom." value="$412" />
      </div>
      {/* Estados distintos por fila: tres badges idénticos no informan nada. */}
      <Table headers={["Pedido", "Estado", "Total"]}>
        <Row left="#1043 · en línea" middle="Nuevo" right="$640.00" highlight />
        <Row left="#1039 · en línea" middle="Enviado" right="$285.00" />
        <Row left="#1036 · en línea" middle="Entregado" right="$310.00" />
      </Table>
    </>
  ),
  money: () => (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Por recibir" value="$8,240" />
        <Metric label="Recibido" value="$34,120" />
        <Metric label="Comisiones" value="$612" />
      </div>
      <Table headers={["Depósito", "Estado", "Monto"]}>
        <Row left="Mañana" middle="Programado" right="$8,240.00" highlight />
        <Row left="22 de julio" middle="Recibido" right="$6,180.00" />
        <Row left="21 de julio" middle="Recibido" right="$5,940.00" />
      </Table>
    </>
  ),
};

/** Ícono por módulo — refuerza que cambió de pantalla, como en el Sidebar. */
const PANEL_ICON: Record<HeroPanelView, typeof Table2> = {
  tables: Table2,
  orders: BarChart3,
  subscriptions: Repeat,
  loans: Banknote,
  site: Globe,
  money: Wallet,
};

export function HeroDashboard({ beat }: { beat: HeroBeat }) {
  const Panel = PANELS[beat.panel.view];
  const Icon = PANEL_ICON[beat.panel.view];

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {/* Chrome de ventana */}
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-3 py-2.5">
          <span className="h-2 w-2 rounded-full bg-red-400/70" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-yellow-400/70" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-green-400/70" aria-hidden />
          <div className="ml-2 flex min-w-0 items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
            <span
              key={`${beat.key}-title`}
              className="animate-fade-in-up truncate text-[11px] font-semibold text-foreground"
            >
              Mi Negocio · {beat.panel.title}
            </span>
          </div>
          <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5">
            <span
              className="animate-hero-live-pulse h-1.5 w-1.5 rounded-full bg-emerald-500"
              aria-hidden
            />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              En vivo
            </span>
          </span>
        </div>

        <div className="space-y-2.5 p-3">
          {/* Aviso — alto reservado para que la tabla no salte */}
          <div className="h-7.5">
            {beat.panel.notice && (
              <div
                key={`${beat.key}-notice`}
                className="animate-hero-row-in flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5"
              >
                <Bell className="h-3 w-3 shrink-0 text-accent" aria-hidden />
                <span className="truncate text-[10px] font-bold text-accent">
                  {beat.panel.notice}
                </span>
              </div>
            )}
          </div>

          <div key={beat.key} className="animate-fade-in-up space-y-2.5">
            <Panel />
          </div>
        </div>
      </div>
    </div>
  );
}
