"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  X,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Wallet,
  Scissors,
} from "lucide-react";
import { MiniCard } from "@/features/onboarding/components/MiniCard";
import { SALES_ONBOARDING_KEY } from "@/features/onboarding/constants";

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
            Ventas del mes
          </p>
          <p className="text-[22px] font-bold leading-tight" style={{ color: "#10b981" }}>
            $45,200
          </p>
          <p className="text-[8px]" style={{ color: "#10b981" }}>
            +18% vs mes anterior
          </p>
          <div className="mt-2 flex h-8 items-end gap-0.5">
            {[30, 50, 45, 65, 55, 80, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${h}%`, background: i === 5 ? "#10b981" : "#d1fae5" }}
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
          <p className="text-[9px]" style={{ color: "#a8a29e" }}>Comisiones</p>
          <p className="text-[24px] font-bold leading-none" style={{ color: "#292524" }}>
            $4,520
          </p>
          <p className="text-[8px]" style={{ color: "#f59e0b" }}>3 pendientes</p>
        </div>
      </MiniCard>

      <MiniCard
        className="absolute"
        style={{ bottom: 6, left: 24, right: 16, transform: "rotate(1deg)" }}
      >
        <div className="flex items-center justify-between p-2.5">
          <div>
            <p className="text-[9px] font-semibold" style={{ color: "#292524" }}>
              Mario Rodríguez
            </p>
            <p className="text-[8px]" style={{ color: "#a8a29e" }}>
              12 órdenes esta semana
            </p>
          </div>
          <p className="text-[11px] font-bold" style={{ color: "#10b981" }}>
            $1,350
          </p>
        </div>
      </MiniCard>
    </div>
  );
}

function ComisionesMockup() {
  const members = [
    { name: "Mario R.", pct: 42, amount: "$1,890", bar: 42 },
    { name: "Ana M.", pct: 31, amount: "$1,395", bar: 31 },
    { name: "Carlos S.", pct: 27, amount: "$1,235", bar: 27 },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-amber-300 to-orange-400 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -20, left: 14, right: 14, transform: "rotate(-1deg)" }}
      >
        <div className="p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-semibold" style={{ color: "#292524" }}>
              Comisiones por persona
            </p>
            <span className="rounded-full px-2 py-0.5 text-[7px] font-medium" style={{ background: "#fef3c7", color: "#92400e" }}>
              Esta semana
            </span>
          </div>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.name}>
                <div className="mb-0.5 flex justify-between">
                  <span className="text-[7px] font-medium" style={{ color: "#292524" }}>{m.name}</span>
                  <span className="text-[7px] font-bold" style={{ color: "#292524" }}>{m.amount}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "#f5f5f4" }}>
                  <div className="h-2 rounded-full" style={{ width: `${m.bar}%`, background: "#f59e0b" }} />
                </div>
                <p className="mt-0.5 text-right text-[6px]" style={{ color: "#a8a29e" }}>{m.pct}% de ventas</p>
              </div>
            ))}
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function PagosMockup() {
  const payments = [
    { name: "Mario R.", period: "Sem 10 Mar", amount: "$1,890", status: "Pagado", bg: "#d1fae5", color: "#059669" },
    { name: "Ana M.", period: "Sem 10 Mar", amount: "$1,395", status: "Pendiente", bg: "#fef3c7", color: "#d97706" },
    { name: "Carlos S.", period: "Sem 3 Mar", amount: "$980", status: "Pagado", bg: "#d1fae5", color: "#059669" },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-blue-400 to-indigo-400 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -30, left: 14, right: 14, transform: "rotate(0.5deg)" }}
      >
        <div className="p-2.5">
          <p className="mb-2 text-[9px] font-semibold" style={{ color: "#292524" }}>
            Historial de pagos
          </p>
          <div className="space-y-1.5">
            {payments.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl p-2"
                style={{ background: "#faf9f7", border: "1px solid #ede9e4" }}
              >
                <div>
                  <p className="text-[8px] font-semibold" style={{ color: "#292524" }}>{p.name}</p>
                  <p className="text-[7px]" style={{ color: "#a8a29e" }}>{p.period}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold" style={{ color: "#292524" }}>{p.amount}</p>
                  <span className="rounded-full px-1.5 py-0.5 text-[6px] font-semibold" style={{ background: p.bg, color: p.color }}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function CortesMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-violet-400 to-purple-400 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -20, left: 14, right: 14, transform: "rotate(-1deg)" }}
      >
        <div className="p-3">
          <div className="mb-3 flex items-center gap-2">
            <Scissors className="h-4 w-4" style={{ color: "#8b5cf6" }} />
            <p className="text-[9px] font-bold" style={{ color: "#292524" }}>
              Corte de caja
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between rounded-lg px-2.5 py-1.5" style={{ background: "#d1fae5" }}>
              <span className="text-[7px] font-medium" style={{ color: "#065f46" }}>Ingresos</span>
              <span className="text-[8px] font-bold" style={{ color: "#059669" }}>$12,450</span>
            </div>
            <div className="flex justify-between rounded-lg px-2.5 py-1.5" style={{ background: "#fef3c7" }}>
              <span className="text-[7px] font-medium" style={{ color: "#92400e" }}>Comisiones pagadas</span>
              <span className="text-[8px] font-bold" style={{ color: "#d97706" }}>-$1,245</span>
            </div>
            <div className="flex justify-between rounded-lg px-2.5 py-1.5" style={{ background: "#dbeafe" }}>
              <span className="text-[7px] font-medium" style={{ color: "#1e40af" }}>Costos</span>
              <span className="text-[8px] font-bold" style={{ color: "#2563eb" }}>-$6,200</span>
            </div>
            <div className="border-t pt-1.5" style={{ borderColor: "#ede9e4" }}>
              <div className="flex justify-between rounded-lg px-2.5 py-1.5" style={{ background: "#ecfdf5" }}>
                <span className="text-[8px] font-bold" style={{ color: "#065f46" }}>Utilidad neta</span>
                <span className="text-[10px] font-bold" style={{ color: "#059669" }}>$5,005</span>
              </div>
            </div>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function ListoMockup() {
  const steps = [
    { icon: BarChart3, name: "Resumen", color: "#10b981", bg: "#d1fae5" },
    { icon: Users, name: "Por persona", color: "#3b82f6", bg: "#dbeafe" },
    { icon: DollarSign, name: "Por orden", color: "#f59e0b", bg: "#fef3c7" },
    { icon: Wallet, name: "Pagos", color: "#8b5cf6", bg: "#ede9fe" },
    { icon: Scissors, name: "Cortes", color: "#ec4899", bg: "#fce7f3" },
    { icon: TrendingUp, name: "Analíticas", color: "#06b6d4", bg: "#cffafe" },
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
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.name}
                  className="flex flex-col items-center gap-1 rounded-xl py-2"
                  style={{ background: s.bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: s.color }} />
                  <span className="text-center text-[7px] font-medium leading-tight" style={{ color: "#292524" }}>
                    {s.name}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 rounded-xl py-2 text-center" style={{ background: "linear-gradient(135deg,#d1fae5,#ecfdf5)" }}>
            <span className="text-[9px] font-semibold" style={{ color: "#059669" }}>
              ¡Controla tus finanzas!
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
    title: "Ventas y\ncomisiones",
    description: "Visualiza todas tus ventas, calcula comisiones automáticamente y lleva el control financiero de tu negocio.",
    Mockup: IntroMockup,
  },
  {
    id: "comisiones",
    title: "Comisiones\nautomáticas",
    description: "Cada venta genera una comisión para el vendedor. El sistema calcula el monto basado en el porcentaje configurado para cada miembro.",
    Mockup: ComisionesMockup,
  },
  {
    id: "pagos",
    title: "Pagos a\ntu equipo",
    description: "Genera pagos por período (diario, semanal o mensual). Marca comisiones como pagadas y lleva el historial completo.",
    Mockup: PagosMockup,
  },
  {
    id: "cortes",
    title: "Cortes de caja",
    description: "Genera cortes de caja para cerrar períodos. Ve ingresos, costos, comisiones y utilidad neta de un vistazo.",
    Mockup: CortesMockup,
  },
  {
    id: "listo",
    title: "¡Todo bajo\ncontrol!",
    description: "Explora las pestañas: Resumen, Por persona, Por orden, Pagos y Cortes. Toda la información financiera en un solo lugar.",
    Mockup: ListoMockup,
  },
] as const;

// ─── Main overlay ─────────────────────────────────────────────
export function SalesOnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const navigating = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SALES_ONBOARDING_KEY)) setVisible(true);
    } catch { /* storage blocked */ }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(SALES_ONBOARDING_KEY, "1"); } catch { /* ignore */ }
    setVisible(false);
  }, []);

  const navigate = useCallback((index: number) => {
    if (navigating.current) return;
    if (index < 0 || index >= slides.length) return;
    navigating.current = true;
    setCurrent(index);
    setTimeout(() => { navigating.current = false; }, 420);
  }, []);

  const next = useCallback(() => {
    if (current === slides.length - 1) { dismiss(); return; }
    navigate(current + 1);
  }, [current, dismiss, navigate]);

  const prev = useCallback(() => { navigate(current - 1); }, [current, navigate]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
      if (dx < 0) next(); else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [next, prev]);

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
    <div className="fixed inset-0 z-9999 flex select-none flex-col overflow-hidden bg-background" role="dialog" aria-modal="true" aria-label="Tutorial de Ventas">
      {!isLast && (
        <button onClick={dismiss} className="absolute right-4 z-10 flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-surface-raised hover:text-foreground active:scale-95" style={{ top: "max(1rem, env(safe-area-inset-top, 1rem))" }} aria-label="Saltar tutorial">
          Saltar <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}

      <div className="flex-1 overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="flex h-full" style={{ width: `${slides.length * 100}%`, transform: `translateX(-${(current / slides.length) * 100}%)`, transition: "transform 380ms cubic-bezier(0.4, 0, 0.2, 1)", willChange: "transform" }}>
          {slides.map((slide) => {
            const { Mockup } = slide;
            return (
              <div key={slide.id} className="flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-10" style={{ width: `${100 / slides.length}%` }}>
                <Mockup />
                <div className="mt-7 max-w-xs text-center">
                  <h1 className="whitespace-pre-line text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">{slide.title}</h1>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{slide.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 px-6 pt-4" style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom, 1.75rem))" }}>
        <div className="flex items-center gap-2" role="tablist" aria-label="Progreso del tutorial">
          {slides.map((s, i) => (
            <button key={s.id} role="tab" aria-selected={i === current} aria-label={`Paso ${i + 1} de ${slides.length}`} onClick={() => navigate(i)} className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-accent" : "w-2 bg-border hover:bg-muted"}`} />
          ))}
        </div>
        <button onClick={next} className="flex w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition-all active:scale-[0.97] active:shadow-sm" style={{ minHeight: "var(--touch-target, 48px)" }}>
          {isLast ? "¡Entendido!" : "Siguiente"}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>
        <span className="pb-1 text-xs text-muted-foreground" aria-live="polite">{current + 1} de {slides.length}</span>
      </div>
    </div>
  );
}
