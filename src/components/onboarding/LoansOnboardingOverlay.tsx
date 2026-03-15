"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { LOANS_ONBOARDING_KEY } from "@/features/onboarding/constants";
import { MiniCard } from "@/features/onboarding/components/MiniCard";

// ─── Slide mockup components ──────────────────────────────────

function IntroMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-emerald-400 to-teal-300 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: 8, left: 16, width: 162, transform: "rotate(-2deg)" }}
      >
        <div className="p-3">
          <p className="text-[9px]" style={{ color: "#a8a29e" }}>
            Préstamos activos
          </p>
          <p
            className="text-[22px] font-bold leading-tight"
            style={{ color: "#10b981" }}
          >
            $18,500
          </p>
          <p className="text-[8px]" style={{ color: "#10b981" }}>
            3 clientes con crédito
          </p>
          <div className="mt-2 flex h-8 items-end gap-0.5">
            {[25, 45, 60, 35, 70, 55, 80].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background: i === 6 ? "#10b981" : "#d1fae5",
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
            Cobros hoy
          </p>
          <p
            className="text-[24px] font-bold leading-none"
            style={{ color: "#292524" }}
          >
            $2,450
          </p>
          <p className="text-[8px]" style={{ color: "#10b981" }}>
            5 pagos recibidos
          </p>
        </div>
      </MiniCard>

      <MiniCard
        className="absolute"
        style={{ bottom: 6, left: 24, right: 16, transform: "rotate(1deg)" }}
      >
        <div className="flex items-center justify-between p-2.5">
          <div>
            <p
              className="text-[9px] font-semibold"
              style={{ color: "#292524" }}
            >
              María Torres
            </p>
            <p className="text-[8px]" style={{ color: "#a8a29e" }}>
              Pago recibido vía MP
            </p>
          </div>
          <p className="text-[11px] font-bold" style={{ color: "#10b981" }}>
            $850
          </p>
        </div>
      </MiniCard>
    </div>
  );
}

function CrearPrestamoMockup() {
  const items = [
    { name: "Laptop Pro", price: "$8,500", qty: "1" },
    { name: "Funda protectora", price: "$350", qty: "1" },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-blue-400 to-indigo-300 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -30, left: 14, right: 14, transform: "rotate(-1deg)" }}
      >
        <div className="p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p
              className="text-[9px] font-semibold"
              style={{ color: "#292524" }}
            >
              Nuevo préstamo
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-[7px] font-medium"
              style={{ background: "#dbeafe", color: "#2563eb" }}
            >
              Paso 1: Cliente
            </span>
          </div>

          <div
            className="mb-2 rounded-xl p-2"
            style={{ background: "#faf9f7", border: "1px solid #ede9e4" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: "#10b981" }}
              >
                <span className="text-[8px] font-bold text-white">JG</span>
              </div>
              <div>
                <p
                  className="text-[8px] font-semibold"
                  style={{ color: "#292524" }}
                >
                  Juan García
                </p>
                <p className="text-[7px]" style={{ color: "#a8a29e" }}>
                  juan@email.com · 55 1234 5678
                </p>
              </div>
            </div>
          </div>

          <p
            className="mb-1.5 text-[8px] font-semibold"
            style={{ color: "#292524" }}
          >
            Productos del préstamo
          </p>
          {items.map((item) => (
            <div
              key={item.name}
              className="mb-1 flex items-center justify-between rounded-lg px-2 py-1.5"
              style={{ background: "#f5f5f4" }}
            >
              <div>
                <p className="text-[7px] font-medium" style={{ color: "#292524" }}>
                  {item.name}
                </p>
                <p className="text-[6px]" style={{ color: "#a8a29e" }}>
                  Cant: {item.qty}
                </p>
              </div>
              <p
                className="text-[8px] font-bold"
                style={{ color: "#10b981" }}
              >
                {item.price}
              </p>
            </div>
          ))}

          <div className="mt-2 flex items-center justify-between border-t pt-2" style={{ borderColor: "#ede9e4" }}>
            <span className="text-[8px] font-semibold" style={{ color: "#292524" }}>Total</span>
            <span className="text-[11px] font-bold" style={{ color: "#10b981" }}>$8,850</span>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function PlazosMockup() {
  const plazos = [
    { n: "4 sem", amount: "$2,325", freq: "Semanal", selected: false },
    { n: "8 sem", amount: "$1,215", freq: "Semanal", selected: true },
    { n: "3 mes", amount: "$3,150", freq: "Mensual", selected: false },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-amber-300 to-orange-400 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -30, left: 14, right: 14, transform: "rotate(1deg)" }}
      >
        <div className="p-2.5">
          <p
            className="mb-2 text-[9px] font-semibold"
            style={{ color: "#292524" }}
          >
            Elige el plan de pagos
          </p>

          <div className="space-y-1.5">
            {plazos.map((p) => (
              <div
                key={p.n}
                className="flex items-center justify-between rounded-xl px-3 py-2"
                style={{
                  background: p.selected ? "#ecfdf5" : "#faf9f7",
                  border: p.selected ? "2px solid #10b981" : "1px solid #ede9e4",
                }}
              >
                <div>
                  <p
                    className="text-[8px] font-semibold"
                    style={{ color: "#292524" }}
                  >
                    {p.n}
                  </p>
                  <p className="text-[7px]" style={{ color: "#a8a29e" }}>
                    {p.freq}
                  </p>
                </div>
                <p
                  className="text-[10px] font-bold"
                  style={{ color: p.selected ? "#10b981" : "#292524" }}
                >
                  {p.amount}/pago
                </p>
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-xl p-2" style={{ background: "#fef3c7" }}>
            <p className="text-[7px] font-medium" style={{ color: "#92400e" }}>
              Interés incluido: se calcula automáticamente según la tasa configurada en tu negocio.
            </p>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function MercadoPagoMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-sky-400 to-blue-500 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -10, left: 14, right: 14, transform: "rotate(-1.5deg)" }}
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
              <p
                className="text-[9px] font-bold"
                style={{ color: "#292524" }}
              >
                Cobro automático
              </p>
              <p className="text-[7px]" style={{ color: "#a8a29e" }}>
                MercadoPago se encarga
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div
              className="flex items-center justify-between rounded-lg px-2.5 py-2"
              style={{ background: "#ecfdf5", border: "1px solid #d1fae5" }}
            >
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#10b981" }} />
                <span className="text-[7px] font-medium" style={{ color: "#065f46" }}>Pago 1</span>
              </div>
              <span className="text-[8px] font-bold" style={{ color: "#10b981" }}>$1,215 ✓</span>
            </div>
            <div
              className="flex items-center justify-between rounded-lg px-2.5 py-2"
              style={{ background: "#ecfdf5", border: "1px solid #d1fae5" }}
            >
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#10b981" }} />
                <span className="text-[7px] font-medium" style={{ color: "#065f46" }}>Pago 2</span>
              </div>
              <span className="text-[8px] font-bold" style={{ color: "#10b981" }}>$1,215 ✓</span>
            </div>
            <div
              className="flex items-center justify-between rounded-lg px-2.5 py-2"
              style={{ background: "#fef3c7", border: "1px solid #fde68a" }}
            >
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} />
                <span className="text-[7px] font-medium" style={{ color: "#92400e" }}>Pago 3 — Hoy</span>
              </div>
              <span className="text-[8px] font-bold" style={{ color: "#d97706" }}>$1,215</span>
            </div>
            <div
              className="flex items-center justify-between rounded-lg px-2.5 py-2"
              style={{ background: "#f5f5f4", border: "1px solid #ede9e4" }}
            >
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#d6d3d1" }} />
                <span className="text-[7px] font-medium" style={{ color: "#78716c" }}>Pago 4</span>
              </div>
              <span className="text-[8px] font-bold" style={{ color: "#a8a29e" }}>$1,215</span>
            </div>
          </div>

          <p className="mt-2 text-[7px] text-center" style={{ color: "#a8a29e" }}>
            El cliente recibe link de pago por email
          </p>
        </div>
      </MiniCard>
    </div>
  );
}

function SeguimientoMockup() {
  const loans = [
    { name: "Juan García", amount: "$8,850", status: "Al día", statusBg: "#d1fae5", statusColor: "#059669", progress: 50 },
    { name: "Ana López", amount: "$3,200", status: "Atrasado", statusBg: "#fef3c7", statusColor: "#d97706", progress: 25 },
    { name: "Carlos M.", amount: "$5,600", status: "Completado", statusBg: "#dbeafe", statusColor: "#2563eb", progress: 100 },
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
        <div className="p-2.5">
          <p className="mb-2 text-[9px] font-semibold" style={{ color: "#292524" }}>
            Tus préstamos
          </p>
          <div className="space-y-1.5">
            {loans.map((l) => (
              <div
                key={l.name}
                className="rounded-xl p-2"
                style={{ background: "#faf9f7", border: "1px solid #ede9e4" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[8px] font-semibold" style={{ color: "#292524" }}>{l.name}</p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[6px] font-semibold"
                    style={{ background: l.statusBg, color: l.statusColor }}
                  >
                    {l.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7px]" style={{ color: "#a8a29e" }}>Total: {l.amount}</span>
                  <span className="text-[7px] font-medium" style={{ color: "#292524" }}>{l.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "#f5f5f4" }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${l.progress}%`, background: l.statusColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function ListoMockup() {
  const steps = [
    { emoji: "👤", name: "Selecciona cliente", color: "#10b981", bg: "#d1fae5" },
    { emoji: "📦", name: "Agrega productos", color: "#3b82f6", bg: "#dbeafe" },
    { emoji: "📅", name: "Elige plazos", color: "#f59e0b", bg: "#fef3c7" },
    { emoji: "💳", name: "Cobra con MP", color: "#009ee3", bg: "#e0f2fe" },
    { emoji: "📊", name: "Da seguimiento", color: "#a855f7", bg: "#ede9fe" },
    { emoji: "💰", name: "Recibe pagos", color: "#ec4899", bg: "#fce7f3" },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-emerald-400 to-green-400 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -30, left: 14, right: 14, transform: "rotate(-0.5deg)" }}
      >
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {steps.map((s) => (
              <div
                key={s.name}
                className="flex flex-col items-center gap-1 rounded-xl py-2"
                style={{ background: s.bg }}
              >
                <span className="text-lg">{s.emoji}</span>
                <span
                  className="text-center text-[7px] font-medium leading-tight"
                  style={{ color: "#292524" }}
                >
                  {s.name}
                </span>
                <div
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
                  style={{ background: "#10b981" }}
                >
                  <span className="text-[7px] font-bold text-white">✓</span>
                </div>
              </div>
            ))}
          </div>
          <div
            className="mt-2.5 rounded-xl py-2 text-center"
            style={{ background: "linear-gradient(135deg,#d1fae5,#ecfdf5)" }}
          >
            <span
              className="text-[9px] font-semibold"
              style={{ color: "#059669" }}
            >
              ¡Empieza a dar crédito hoy!
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
    title: "Préstamos y\ncréditos a clientes",
    description:
      "Ofrece crédito a tus clientes directamente desde tu negocio. Tú defines montos, plazos e intereses.",
    Mockup: IntroMockup,
  },
  {
    id: "crear",
    title: "Crea un préstamo\nen segundos",
    description:
      "Selecciona un cliente (o crea uno nuevo), agrega los productos y define el monto total del crédito.",
    Mockup: CrearPrestamoMockup,
  },
  {
    id: "plazos",
    title: "Plazos flexibles\ncon interés automático",
    description:
      "Elige semanal, quincenal o mensual. El sistema calcula el interés y genera el calendario de pagos automáticamente.",
    Mockup: PlazosMockup,
  },
  {
    id: "mp",
    title: "Cobra con\nMercadoPago",
    description:
      "Cada pago se cobra automáticamente vía MercadoPago. El cliente recibe un link de pago seguro por email.",
    Mockup: MercadoPagoMockup,
  },
  {
    id: "seguimiento",
    title: "Seguimiento\nen tiempo real",
    description:
      "Ve el estado de cada préstamo: pagos recibidos, montos pendientes y alertas de atraso. Todo desde tu dashboard.",
    Mockup: SeguimientoMockup,
  },
  {
    id: "listo",
    title: "¡Listo para\ndar crédito!",
    description:
      "Ve a la sección de Préstamos para crear tu primer crédito. Tus clientes te lo agradecerán.",
    Mockup: ListoMockup,
  },
] as const;

// ─── Main overlay ─────────────────────────────────────────────
export function LoansOnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const navigating = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(LOANS_ONBOARDING_KEY)) setVisible(true);
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
      localStorage.setItem(LOANS_ONBOARDING_KEY, "1");
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
      aria-label="Tutorial de Préstamos"
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
