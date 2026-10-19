import { ArrowRight, BadgePercent, CalendarClock, CheckCircle2, UsersRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import type { SolutionCapability } from "@/features/solutions/interfaces/solutionExperience";

const CHOICE = "rounded-xl border px-2 py-3 text-center text-xs font-semibold text-foreground";
const CHOICE_ON = "border-foreground bg-border-soft dark:bg-border";
const CHOICE_OFF = "border-border";

function PreviewBody({ capability, done, previewUrl }: { capability: SolutionCapability; done: boolean; previewUrl: string }) {
  switch (capability.key) {
    case "store":
      return (
        <div className="grid gap-4 sm:grid-cols-[1fr_132px] sm:items-center">
          <div className="space-y-2">
            {["Catálogo público", "Carrito y pedido", "Promociones visibles"].map((label, index) => {
              const pending = index === 2 && !done;
              return (
                <div key={label} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className={`text-xs font-bold ${pending ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {pending ? "Por publicar" : "Listo"}
                  </span>
                </div>
              );
            })}
          </div>
          {/* QR stays dark-on-white in both themes so phones can scan it. */}
          <div className="mx-auto rounded-2xl bg-white p-3 text-center">
            <QRCodeSVG value={previewUrl} size={104} bgColor="#ffffff" fgColor="#111318" level="M" />
            <p className="mt-2 text-[10px] font-semibold text-slate-600">Ábrelo en tu celular</p>
          </div>
        </div>
      );
    case "payments":
      return (
        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Pedido #108</p>
              <p className="mt-1 text-3xl font-bold text-foreground">$129</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${done ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}>
              {done ? "Enlace enviado" : "Pago pendiente"}
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {["Efectivo", "Transferencia", "En línea"].map((method) => (
              <div key={method} className={`${CHOICE} ${method === "En línea" ? CHOICE_ON : CHOICE_OFF}`}>{method}</div>
            ))}
          </div>
        </div>
      );
    case "schedule":
      return (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">¿Cuándo lo necesitas?</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["Hoy", "Mañana", "Sábado"].map((day, index) => (
              <div key={day} className={`${CHOICE} text-sm ${index === 0 ? CHOICE_ON : CHOICE_OFF}`}>{day}</div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-accent/10 px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Recoger a las 18:30</span>
            <CalendarClock className="h-5 w-5 text-accent" aria-hidden />
          </div>
        </div>
      );
    case "promotions":
      return (
        <div className="rounded-2xl bg-coin/10 p-5">
          <p className="text-xs font-bold text-coin-ink dark:text-coin">Promoción de hoy</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-coin-ink dark:text-coin">2 × $55</p>
              <p className="mt-1 text-sm text-coin-ink/80 dark:text-coin/80">En productos seleccionados · hasta las 20:00</p>
            </div>
            <BadgePercent className="h-10 w-10 text-coin" aria-hidden />
          </div>
        </div>
      );
    case "memberships":
      return (
        <div className="rounded-2xl bg-foreground p-5 text-background">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold opacity-60">Cliente frecuente</p>
              <p className="mt-1 text-xl font-bold">Ana Martínez</p>
            </div>
            <UsersRound className="h-6 w-6 text-accent" aria-hidden />
          </div>
          <div className="mt-6 flex gap-1.5" aria-hidden>
            {Array.from({ length: 10 }, (_, index) => (
              <span key={index} className={`h-2 flex-1 rounded-full ${index < (done ? 8 : 7) ? "bg-accent" : "bg-background/20"}`} />
            ))}
          </div>
          <p className="mt-3 text-sm opacity-70">{done ? "2 visitas para desbloquear su beneficio" : "3 visitas para desbloquear su beneficio"}</p>
        </div>
      );
    case "credit":
      return (
        <div>
          <div className="flex items-center justify-between rounded-2xl border border-border p-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Crédito de cliente</p>
              <p className="mt-1 font-bold text-foreground">Carlos Hernández</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="text-2xl font-bold text-foreground">{done ? "$380" : "$580"}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-border-soft p-3 dark:bg-border">
              <p className="text-muted-foreground">Último abono</p>
              <p className="mt-1 font-bold text-foreground">{done ? "$200 · hoy" : "$150 · 2 oct"}</p>
            </div>
            <div className="rounded-xl bg-border-soft p-3 dark:bg-border">
              <p className="text-muted-foreground">Próximo acuerdo</p>
              <p className="mt-1 font-bold text-foreground">16 de octubre</p>
            </div>
          </div>
        </div>
      );
    case "kiosk":
      return (
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div className="grid grid-cols-2 gap-2">
            {["Combo 1", "Combo 2", "Bebidas", "Extras"].map((item, index) => (
              <div key={item} className={`rounded-xl p-3 text-sm font-semibold ${index === 0 ? "bg-accent text-accent-foreground" : "bg-border-soft text-foreground dark:bg-border"}`}>
                {item}
                <span className="mt-3 block text-xs opacity-70">Tocar para elegir</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-foreground p-3 text-background">
            <p className="text-[10px] font-bold opacity-60">Mi pedido</p>
            <p className="mt-3 text-sm font-semibold">1 × Combo 1</p>
            <p className="mt-1 text-xs opacity-60">Para llevar</p>
            <p className="mt-8 text-xl font-bold">$149</p>
          </div>
        </div>
      );
  }
}

export function CapabilityPreview({
  capability,
  done,
  onAction,
  name,
  previewUrl,
}: {
  capability: SolutionCapability;
  done: boolean;
  onAction: () => void;
  name: string;
  previewUrl: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-surface-raised p-3 sm:p-5">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{name}</p>
            <p className="text-sm font-bold text-foreground">{capability.title}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            Conectado
          </span>
        </div>
        <div key={capability.key} className="animate-fade-in-up p-4 sm:p-5">
          <PreviewBody capability={capability} done={done} previewUrl={previewUrl} />
          <button
            type="button"
            onClick={onAction}
            className={`mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold ${
              done ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-foreground text-background"
            }`}
          >
            {done ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
            {done ? capability.completed : capability.action}
          </button>
        </div>
      </div>
    </div>
  );
}
