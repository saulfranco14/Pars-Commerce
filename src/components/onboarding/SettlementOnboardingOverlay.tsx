"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, X, Wallet, CheckCircle2, Banknote } from "lucide-react";
import { MiniCard } from "@/features/onboarding/components/MiniCard";
import { SETTLEMENT_ONBOARDING_KEY } from "@/features/onboarding/constants";

// ─── Slide mockup components ──────────────────────────────────

function DineroMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-emerald-400 to-teal-300 opacity-20 blur-3xl" />
      </div>
      <MiniCard
        className="absolute"
        style={{ top: 20, left: 20, right: 20, transform: "rotate(-1.5deg)" }}
      >
        <div className="p-4">
          <p className="text-[9px]" style={{ color: "#a8a29e" }}>
            Por recibir de Mercado Pago
          </p>
          <p className="text-[26px] font-bold leading-tight" style={{ color: "#10b981" }}>
            $8,450
          </p>
          <div className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ background: "#d1fae5" }}>
            <Wallet className="h-3 w-3" style={{ color: "#059669" }} />
            <span className="text-[8px] font-semibold" style={{ color: "#065f46" }}>
              Se te transfiere según tu frecuencia
            </span>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function FrecuenciaMockup() {
  const options = [
    { label: "Diario", pct: "3.5%", amount: "$965", sel: false },
    { label: "Semanal", pct: "3.0%", amount: "$970", sel: true },
    { label: "Mensual", pct: "2.0%", amount: "$980", sel: false },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-blue-400 to-indigo-400 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: -14, left: 14, right: 14 }}>
        <div className="p-2.5">
          <p className="mb-2 text-[9px] font-semibold" style={{ color: "#292524" }}>
            ¿Cada cuándo quieres tu dinero?
          </p>
          <div className="space-y-1.5">
            {options.map((o) => (
              <div
                key={o.label}
                className="flex items-center justify-between rounded-xl px-2.5 py-2"
                style={{
                  background: o.sel ? "#eff6ff" : "#faf9f7",
                  border: `1.5px solid ${o.sel ? "#3b82f6" : "#ede9e4"}`,
                }}
              >
                <div>
                  <p className="text-[8px] font-semibold" style={{ color: "#292524" }}>{o.label}</p>
                  <p className="text-[7px]" style={{ color: "#a8a29e" }}>Comisión {o.pct}</p>
                </div>
                <span className="text-[10px] font-bold" style={{ color: o.sel ? "#2563eb" : "#292524" }}>
                  {o.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function BeneficioMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-amber-300 to-orange-400 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: 8, left: 16, width: 150, transform: "rotate(-2deg)" }}>
        <div className="p-3">
          <p className="text-[8px] font-semibold" style={{ color: "#a8a29e" }}>Diario</p>
          <p className="text-[20px] font-bold leading-tight" style={{ color: "#292524" }}>$965</p>
          <p className="text-[8px]" style={{ color: "#dc2626" }}>comisión 3.5%</p>
        </div>
      </MiniCard>
      <MiniCard className="absolute" style={{ bottom: 8, right: 16, width: 150, transform: "rotate(2.5deg)" }}>
        <div className="p-3">
          <p className="text-[8px] font-semibold" style={{ color: "#059669" }}>Mensual</p>
          <p className="text-[20px] font-bold leading-tight" style={{ color: "#10b981" }}>$980</p>
          <p className="text-[8px]" style={{ color: "#059669" }}>comisión 2.0%</p>
        </div>
      </MiniCard>
    </div>
  );
}

function RecibidoMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-emerald-400 to-green-400 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: 6, left: 14, right: 14, transform: "rotate(-0.5deg)" }}>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px]" style={{ color: "#a8a29e" }}>7 – 14 mar · Semanal</p>
            <span className="rounded-full px-2 py-0.5 text-[7px] font-semibold" style={{ background: "#d1fae5", color: "#059669" }}>
              Recibido
            </span>
          </div>
          <p className="mt-1 text-[22px] font-bold leading-tight" style={{ color: "#292524" }}>$3,880</p>
          <div className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5" style={{ background: "#ecfdf5" }}>
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#059669" }} />
            <span className="text-[7px]" style={{ color: "#065f46" }}>
              12 mar · Ref: SPEI-4821 · Ver comprobante
            </span>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function EfectivoMockup() {
  const rows = [
    { label: "Efectivo", amount: "$4,200", note: "ya es tuyo", color: "#059669", bg: "#d1fae5" },
    { label: "Transferencia", amount: "$1,800", note: "ya es tuyo", color: "#059669", bg: "#d1fae5" },
    { label: "Mercado Pago", amount: "$8,450", note: "te lo liquidamos", color: "#2563eb", bg: "#dbeafe" },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-violet-400 to-purple-400 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: 0, left: 14, right: 14 }}>
        <div className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <Banknote className="h-4 w-4" style={{ color: "#8b5cf6" }} />
            <p className="text-[9px] font-bold" style={{ color: "#292524" }}>Cómo entró tu dinero</p>
          </div>
          <div className="space-y-1.5">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ background: r.bg }}>
                <div>
                  <span className="text-[8px] font-semibold" style={{ color: "#292524" }}>{r.label}</span>
                  <span className="ml-1 text-[7px]" style={{ color: r.color }}>· {r.note}</span>
                </div>
                <span className="text-[9px] font-bold" style={{ color: r.color }}>{r.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

// ─── Slides configuration ─────────────────────────────────────
const slides = [
  {
    id: "dinero",
    title: "Tu dinero,\nordenado",
    description:
      "Los pagos que recibes por Mercado Pago se juntan y te los transferimos. Aquí ves cuánto tienes por recibir en todo momento.",
    Mockup: DineroMockup,
  },
  {
    id: "frecuencia",
    title: "Tú eliges\ncada cuándo",
    description:
      "Diario, semanal, quincenal o mensual. Configura la frecuencia con la que quieres recibir tu dinero — y cámbiala cuando quieras.",
    Mockup: FrecuenciaMockup,
  },
  {
    id: "beneficio",
    title: "Menos seguido,\nmenos comisión",
    description:
      "Mientras menos seguido recibas, menor es la comisión. Si puedes esperar, te queda más dinero en el bolsillo. Tú decides el balance.",
    Mockup: BeneficioMockup,
  },
  {
    id: "recibido",
    title: "Sabes cuándo\nte llegó",
    description:
      "Cuando te entregamos tu dinero, lo marcamos como recibido con la fecha, la referencia y el comprobante. Todo queda registrado.",
    Mockup: RecibidoMockup,
  },
  {
    id: "efectivo",
    title: "El efectivo\nsigue siendo tuyo",
    description:
      "Solo el dinero de Mercado Pago pasa por nosotros. Lo que cobras en efectivo o transferencia directa ya lo tienes tú — aquí solo lo ves reflejado.",
    Mockup: EfectivoMockup,
  },
] as const;

// ─── Main overlay ─────────────────────────────────────────────
export function SettlementOnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const navigating = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SETTLEMENT_ONBOARDING_KEY)) setVisible(true);
    } catch {
      /* storage blocked */
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(SETTLEMENT_ONBOARDING_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  const navigate = useCallback((index: number) => {
    if (navigating.current) return;
    if (index < 0 || index >= slides.length) return;
    navigating.current = true;
    setCurrent(index);
    setTimeout(() => {
      navigating.current = false;
    }, 420);
  }, []);

  const next = useCallback(() => {
    if (current === slides.length - 1) {
      dismiss();
      return;
    }
    navigate(current + 1);
  }, [current, dismiss, navigate]);

  const prev = useCallback(() => {
    navigate(current - 1);
  }, [current, navigate]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
        if (dx < 0) next();
        else prev();
      }
      touchStartX.current = null;
      touchStartY.current = null;
    },
    [next, prev],
  );

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, next, prev, dismiss]);

  if (!visible) return null;
  const isLast = current === slides.length - 1;

  return (
    <div
      className="fixed inset-0 z-9999 flex select-none flex-col overflow-hidden bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de Liquidaciones"
    >
      {!isLast && (
        <button
          onClick={dismiss}
          className="absolute right-4 z-10 flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-surface-raised hover:text-foreground active:scale-95"
          style={{ top: "max(1rem, env(safe-area-inset-top, 1rem))" }}
          aria-label="Saltar tutorial"
        >
          Saltar <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}

      <div
        className="flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${(current / slides.length) * 100}%)`,
            transition: "transform 380ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {slides.map((slide) => {
            const { Mockup } = slide;
            return (
              <div
                key={slide.id}
                className="flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-10"
                style={{ width: `${100 / slides.length}%` }}
              >
                <Mockup />
                <div className="mt-7 max-w-xs text-center">
                  <h1 className="whitespace-pre-line text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">
                    {slide.title}
                  </h1>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                    {slide.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="flex flex-col items-center gap-4 px-6 pt-4"
        style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom, 1.75rem))" }}
      >
        <div className="flex items-center gap-2" role="tablist" aria-label="Progreso del tutorial">
          {slides.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === current}
              aria-label={`Paso ${i + 1} de ${slides.length}`}
              onClick={() => navigate(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-accent" : "w-2 bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="flex w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition-all active:scale-[0.97] active:shadow-sm"
          style={{ minHeight: "var(--touch-target, 48px)" }}
        >
          {isLast ? "Configurar mi frecuencia" : "Siguiente"}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>
        <span className="pb-1 text-xs text-muted-foreground" aria-live="polite">
          {current + 1} de {slides.length}
        </span>
      </div>
    </div>
  );
}
