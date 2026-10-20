import {
  Check,
  ClipboardList,
  Clock,
  CreditCard,
  PackageCheck,
  Receipt,
} from "lucide-react";

import {
  PhoneFooter,
  PhoneHero,
  PhoneStatus,
} from "@/features/landing/components/hero/phone/PhoneParts";

import { getMenuTotal } from "@/features/landing/helpers/heroSandbox";
import { formatMXN } from "@/lib/loanUtils";

import type {
  HeroOrderStatus,
  HeroPhoneViewProps,
} from "@/features/landing/interfaces/heroDemo";

const STEPS: {
  status: HeroOrderStatus;
  label: string;
  hint: string;
  icon: typeof Check;
}[] = [
  { status: "received", label: "Recibido", hint: "Tu pedido llegó al negocio", icon: Check },
  { status: "in_progress", label: "En proceso", hint: "Lo están atendiendo", icon: Clock },
  { status: "ready", label: "Listo", hint: "Ya puedes pagar", icon: PackageCheck },
];

const STEP_POSITION: Record<HeroOrderStatus, number> = {
  draft: -1,
  received: 0,
  in_progress: 1,
  ready: 2,
  paid: 3,
};

export function TrackerView({ sandbox, controls }: HeroPhoneViewProps) {
  if (sandbox.order === "draft") {
    return (
      <>
        <PhoneHero kicker="Tu pedido" title="Mesa 4" />
        <PhoneStatus
          icon={ClipboardList}
          tone="muted"
          title="Aún no envías tu pedido"
          detail="Elige tus productos y aquí verás su avance en vivo"
        />
        <PhoneFooter label="Ir a pedir" onClick={() => controls.goToBeat("mesas")} />
      </>
    );
  }

  const position = STEP_POSITION[sandbox.order];
  const total = formatMXN(getMenuTotal(sandbox));

  return (
    <>
      <PhoneHero kicker="Tu pedido" title="Mesa 4" />
      <div className="flex flex-1 flex-col justify-center gap-2 p-2.5" aria-live="polite">
        {STEPS.map(({ status, label, hint, icon: Icon }, i) => {
          const done = i <= position;
          const current = i === position;
          return (
            <div
              key={status}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors duration-500 ${
                current ? "border-accent bg-accent/8" : "border-border bg-surface"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${
                  done ? "bg-accent text-accent-foreground" : "bg-border text-muted-foreground"
                }`}
              >
                <Icon className="h-3 w-3" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[11px] font-bold leading-tight ${
                    done ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                <span className="block truncate text-[10px] leading-tight text-muted-foreground">
                  {hint}
                </span>
              </span>
              {current && (
                <span className="shrink-0 text-[10px] font-bold text-accent">Ahora</span>
              )}
            </div>
          );
        })}
        <p className="text-center text-[10px] text-muted-foreground">
          {sandbox.order === "paid"
            ? "Pagado · gracias por tu visita"
            : "El negocio lo actualiza en vivo"}
        </p>
      </div>
      {sandbox.order === "paid" ? (
        <PhoneFooter
          label="Ver mi comprobante"
          icon={Receipt}
          onClick={() => controls.goToBeat("dinero")}
        />
      ) : (
        <PhoneFooter
          label={sandbox.order === "ready" ? `Pagar · ${total}` : "Podrás pagar cuando esté listo"}
          icon={CreditCard}
          disabled={sandbox.order !== "ready"}
          onClick={() => controls.goToBeat("dinero")}
        />
      )}
    </>
  );
}
