"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  X,
  Settings,
  ShoppingCart,
  CreditCard,
  Repeat,
  BarChart3,
  Banknote,
  CheckCircle2,
  SplitSquareHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SUBSCRIPTIONS_ONBOARDING_KEY } from "@/features/onboarding/constants";
import { MiniCard } from "@/features/onboarding/components/MiniCard";

// ─── Slide mockup components ──────────────────────────────────

function IntroMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-violet-400 to-purple-300 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: 8, left: 16, width: 162, transform: "rotate(-2deg)" }}
      >
        <div className="p-3">
          <p className="text-[9px]" style={{ color: "#a8a29e" }}>
            Ingresos recurrentes
          </p>
          <p
            className="text-[22px] font-bold leading-tight"
            style={{ color: "#8b5cf6" }}
          >
            $12,800
          </p>
          <p className="text-[8px]" style={{ color: "#10b981" }}>
            ↑ +15% vs mes anterior
          </p>
          <div className="mt-2 flex h-8 items-end gap-0.5">
            {[30, 45, 50, 55, 60, 70, 85].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background: i === 6 ? "#8b5cf6" : "#ede9fe",
                }}
              />
            ))}
          </div>
        </div>
      </MiniCard>

      <MiniCard
        className="absolute"
        style={{ top: 62, right: 12, width: 112, transform: "rotate(3.5deg)" }}
      >
        <div className="p-3">
          <p className="text-[9px]" style={{ color: "#a8a29e" }}>
            Suscripciones
          </p>
          <p
            className="text-[24px] font-bold leading-none"
            style={{ color: "#292524" }}
          >
            24
          </p>
          <p className="text-[8px]" style={{ color: "#10b981" }}>
            activas este mes
          </p>
        </div>
      </MiniCard>

      <MiniCard
        className="absolute"
        style={{ bottom: 6, left: 24, right: 16, transform: "rotate(1deg)" }}
      >
        <div className="flex items-center justify-between p-2.5">
          <div>
            <p className="text-[9px] font-semibold" style={{ color: "#292524" }}>
              Cobro automático
            </p>
            <p className="text-[8px]" style={{ color: "#a8a29e" }}>
              5 pagos procesados hoy
            </p>
          </div>
          <p className="text-[11px] font-bold" style={{ color: "#8b5cf6" }}>
            $3,200
          </p>
        </div>
      </MiniCard>
    </div>
  );
}

function TiposMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-blue-400 to-cyan-300 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -30, left: 14, right: 14, transform: "rotate(-1deg)" }}
      >
        <div className="p-2.5">
          <p className="mb-2 text-[9px] font-semibold" style={{ color: "#292524" }}>
            Dos modalidades
          </p>

          <div
            className="mb-2 rounded-xl p-2.5"
            style={{ background: "#ede9fe", border: "2px solid #8b5cf6" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <SplitSquareHorizontal className="h-4 w-4" style={{ color: "#5b21b6" }} />
              <p className="text-[9px] font-bold" style={{ color: "#5b21b6" }}>
                En cuotas
              </p>
            </div>
            <p className="text-[7px]" style={{ color: "#6d28d9" }}>
              El cliente paga un monto fijo dividido en N pagos.
              Ideal para compras grandes que quieran pagar poco a poco.
            </p>
            <div className="mt-1.5 flex gap-1">
              {["2x", "3x", "6x", "12x"].map((n) => (
                <span
                  key={n}
                  className="rounded-full px-1.5 py-0.5 text-[6px] font-bold"
                  style={{ background: "#c4b5fd", color: "#5b21b6" }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl p-2.5"
            style={{ background: "#dbeafe", border: "1px solid #93c5fd" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="h-4 w-4" style={{ color: "#1e40af" }} />
              <p className="text-[9px] font-bold" style={{ color: "#1e40af" }}>
                Recurrente
              </p>
            </div>
            <p className="text-[7px]" style={{ color: "#1e40af" }}>
              Se cobra periódicamente sin fecha de fin.
              Ideal para servicios continuos o entregas regulares.
            </p>
            <div className="mt-1.5 flex gap-1">
              {["Semanal", "Quincenal", "Mensual"].map((f) => (
                <span
                  key={f}
                  className="rounded-full px-1.5 py-0.5 text-[6px] font-bold"
                  style={{ background: "#93c5fd", color: "#1e40af" }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function ClienteVeMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-pink-400 to-rose-300 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -20, left: 12, right: 12, transform: "rotate(-1.5deg)" }}
      >
        {/* Browser chrome */}
        <div
          className="flex items-center gap-1.5 rounded-t-2xl px-3 py-2"
          style={{ background: "#f5f5f4", borderBottom: "1px solid #ede9e4" }}
        >
          <div className="flex gap-1">
            {["#ef4444", "#f59e0b", "#10b981"].map((c) => (
              <div
                key={c}
                className="rounded-full"
                style={{ width: 6, height: 6, background: c }}
              />
            ))}
          </div>
          <div
            className="flex flex-1 items-center justify-center rounded-md"
            style={{ background: "white", height: 14 }}
          >
            <span className="text-[7px]" style={{ color: "#78716c" }}>
              🛒 Tu tienda / carrito
            </span>
          </div>
        </div>

        <div className="p-2.5" style={{ background: "#faf9f7" }}>
          <p className="mb-2 text-[8px] font-semibold" style={{ color: "#292524" }}>
            ¿Cómo quieres pagar?
          </p>
          <div className="grid grid-cols-3 gap-1">
            <div className="flex flex-col items-center rounded-lg p-1.5" style={{ background: "#f5f5f4", border: "1px solid #ede9e4" }}>
              <CreditCard className="h-3 w-3" style={{ color: "#78716c" }} />
              <p className="text-[6px] font-medium" style={{ color: "#78716c" }}>Pago único</p>
            </div>
            <div className="flex flex-col items-center rounded-lg p-1.5" style={{ background: "#ede9fe", border: "2px solid #8b5cf6" }}>
              <SplitSquareHorizontal className="h-3 w-3" style={{ color: "#5b21b6" }} />
              <p className="text-[6px] font-bold" style={{ color: "#5b21b6" }}>En cuotas</p>
            </div>
            <div className="flex flex-col items-center rounded-lg p-1.5" style={{ background: "#f5f5f4", border: "1px solid #ede9e4" }}>
              <Repeat className="h-3 w-3" style={{ color: "#78716c" }} />
              <p className="text-[6px] font-medium" style={{ color: "#78716c" }}>Recurrente</p>
            </div>
          </div>

          <div className="mt-2 rounded-lg p-2" style={{ background: "white", border: "1px solid #ede9e4" }}>
            <div className="flex justify-between mb-1">
              <span className="text-[7px]" style={{ color: "#78716c" }}>3x $166.67</span>
              <span className="text-[7px] font-bold" style={{ color: "#8b5cf6" }}>Semanal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[7px]" style={{ color: "#78716c" }}>Total</span>
              <span className="text-[8px] font-bold" style={{ color: "#292524" }}>$500.00</span>
            </div>
          </div>

          <div
            className="mt-2 rounded-lg py-1.5 text-center"
            style={{ background: "#8b5cf6" }}
          >
            <span className="text-[7px] font-bold text-white">Continuar al pago →</span>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function CobroMPMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-sky-400 to-blue-500 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -10, left: 14, right: 14, transform: "rotate(1deg)" }}
      >
        <div className="p-3">
          <div className="mb-3 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "#009ee3" }}
            >
              <span className="text-[10px] font-bold text-white">MP</span>
            </div>
            <div>
              <p className="text-[9px] font-bold" style={{ color: "#292524" }}>
                MercadoPago Suscripciones
              </p>
              <p className="text-[7px]" style={{ color: "#a8a29e" }}>
                Cobro automático con tarjeta
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 rounded-lg p-2" style={{ background: "#ecfdf5" }}>
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: "#059669" }}>
                <span className="text-[8px] font-bold text-white">1</span>
              </div>
              <div>
                <p className="text-[7px] font-semibold" style={{ color: "#065f46" }}>
                  Cliente autoriza su tarjeta
                </p>
                <p className="text-[6px]" style={{ color: "#059669" }}>
                  Pago seguro vía MercadoPago
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg p-2" style={{ background: "#ede9fe" }}>
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: "#7c3aed" }}>
                <span className="text-[8px] font-bold text-white">2</span>
              </div>
              <div>
                <p className="text-[7px] font-semibold" style={{ color: "#5b21b6" }}>
                  Se cobran las cuotas automáticamente
                </p>
                <p className="text-[6px]" style={{ color: "#7c3aed" }}>
                  Según la frecuencia elegida
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg p-2" style={{ background: "#dbeafe" }}>
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: "#2563eb" }}>
                <span className="text-[8px] font-bold text-white">3</span>
              </div>
              <div>
                <p className="text-[7px] font-semibold" style={{ color: "#1e40af" }}>
                  Recibes el dinero en tu cuenta
                </p>
                <p className="text-[6px]" style={{ color: "#2563eb" }}>
                  Sin hacer nada manualmente
                </p>
              </div>
            </div>
          </div>

          <p className="mt-2 text-[7px] text-center" style={{ color: "#a8a29e" }}>
            Tú solo configuras, MP se encarga del resto
          </p>
        </div>
      </MiniCard>
    </div>
  );
}

function DashboardMockup() {
  const subs = [
    { name: "María T.", type: "Cuotas 3/6", status: "Activa", bg: "#d1fae5", color: "#059669" },
    { name: "Pedro R.", type: "Recurrente", status: "Activa", bg: "#d1fae5", color: "#059669" },
    { name: "Laura G.", type: "Cuotas 6/6", status: "Completada", bg: "#dbeafe", color: "#2563eb" },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-emerald-400 to-teal-300 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -30, left: 14, right: 14, transform: "rotate(-0.5deg)" }}
      >
        <div className="p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-semibold" style={{ color: "#292524" }}>
              Suscripciones
            </p>
            <div className="flex gap-1">
              {["Todas", "Activas", "Completadas"].map((t, i) => (
                <span
                  key={t}
                  className="rounded-full px-1.5 py-0.5 text-[6px] font-medium"
                  style={
                    i === 0
                      ? { background: "#8b5cf6", color: "white" }
                      : { background: "#f5f5f4", color: "#78716c" }
                  }
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {subs.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between rounded-xl p-2"
                style={{ background: "#faf9f7", border: "1px solid #ede9e4" }}
              >
                <div>
                  <p className="text-[8px] font-semibold" style={{ color: "#292524" }}>
                    {s.name}
                  </p>
                  <p className="text-[7px]" style={{ color: "#a8a29e" }}>
                    {s.type}
                  </p>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[6px] font-semibold"
                  style={{ background: s.bg, color: s.color }}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function ListoMockup() {
  const steps: { icon: LucideIcon; name: string; color: string; bg: string }[] = [
    { icon: Settings, name: "Configura opciones", color: "#8b5cf6", bg: "#ede9fe" },
    { icon: ShoppingCart, name: "Cliente compra", color: "#ec4899", bg: "#fce7f3" },
    { icon: CreditCard, name: "Autoriza tarjeta", color: "#009ee3", bg: "#e0f2fe" },
    { icon: Repeat, name: "Cobro automático", color: "#10b981", bg: "#d1fae5" },
    { icon: BarChart3, name: "Monitorea todo", color: "#f59e0b", bg: "#fef3c7" },
    { icon: Banknote, name: "Recibe pagos", color: "#3b82f6", bg: "#dbeafe" },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-violet-400 to-purple-400 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -30, left: 14, right: 14, transform: "rotate(-0.5deg)" }}
      >
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.name}
                  className="flex flex-col items-center gap-1 rounded-xl py-2"
                  style={{ background: s.bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: s.color }} />
                  <span
                    className="text-center text-[7px] font-medium leading-tight"
                    style={{ color: "#292524" }}
                  >
                    {s.name}
                  </span>
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
                </div>
              );
            })}
          </div>
          <div
            className="mt-2.5 rounded-xl py-2 text-center"
            style={{ background: "linear-gradient(135deg,#ede9fe,#f5f3ff)" }}
          >
            <span className="text-[9px] font-semibold" style={{ color: "#7c3aed" }}>
              ¡Activa suscripciones ahora!
            </span>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

// ─── Slides configuration ─────────────────────────────────────
const slides = [
  {
    id: "intro",
    title: "Suscripciones y\npagos recurrentes",
    description:
      "Permite a tus clientes pagar en cuotas o de forma recurrente directamente desde tu tienda online.",
    Mockup: IntroMockup,
  },
  {
    id: "tipos",
    title: "Cuotas o\nrecurrente",
    description:
      "En cuotas: el cliente divide su compra en N pagos fijos. Recurrente: se cobra periódicamente sin fecha de fin.",
    Mockup: TiposMockup,
  },
  {
    id: "cliente",
    title: "Así lo ve\ntu cliente",
    description:
      "En el carrito de tu tienda, el cliente elige cómo pagar: único, en cuotas o recurrente. Tú defines las opciones disponibles.",
    Mockup: ClienteVeMockup,
  },
  {
    id: "cobro",
    title: "MercadoPago\ncobra por ti",
    description:
      "El cliente autoriza su tarjeta una sola vez. MercadoPago cobra automáticamente cada periodo sin que hagas nada.",
    Mockup: CobroMPMockup,
  },
  {
    id: "dashboard",
    title: "Todo en\ntu dashboard",
    description:
      "Ve el estado de cada suscripción, pagos completados, pendientes y cancelaciones. Filtros por tipo y estado.",
    Mockup: DashboardMockup,
  },
  {
    id: "listo",
    title: "¡Activa\nsuscripciones!",
    description:
      "Ve a Configuración → Compras recurrentes para activar cuotas y/o suscripciones en tu tienda.",
    Mockup: ListoMockup,
  },
] as const;

// ─── Main overlay ─────────────────────────────────────────────
export function SubscriptionsOnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const navigating = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SUBSCRIPTIONS_ONBOARDING_KEY)) setVisible(true);
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
      localStorage.setItem(SUBSCRIPTIONS_ONBOARDING_KEY, "1");
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
      aria-label="Tutorial de Suscripciones"
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
        style={{
          paddingBottom: "max(1.75rem, env(safe-area-inset-bottom, 1.75rem))",
        }}
      >
        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Progreso del tutorial"
        >
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
          {isLast ? "¡Entendido!" : "Siguiente"}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>

        <span className="pb-1 text-xs text-muted-foreground" aria-live="polite">
          {current + 1} de {slides.length}
        </span>
      </div>
    </div>
  );
}
