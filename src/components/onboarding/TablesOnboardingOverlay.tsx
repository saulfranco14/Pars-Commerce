"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, X, Store, QrCode, Clock, Users } from "lucide-react";
import { MiniCard } from "@/features/onboarding/components/MiniCard";
import { TABLES_ONBOARDING_KEY } from "@/features/onboarding/constants";

// ─── Slide mockups ────────────────────────────────────────────

function QueEsMockup() {
  const tables = [
    { name: "Lugar 1", state: "Libre", bg: "#d1fae5", color: "#059669" },
    { name: "Lugar 2", state: "En uso", bg: "#fef3c7", color: "#d97706" },
    { name: "Lugar 3", state: "En uso", bg: "#fef3c7", color: "#d97706" },
    { name: "Lugar 4", state: "Libre", bg: "#d1fae5", color: "#059669" },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-emerald-400 to-teal-300 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: 6, left: 14, right: 14 }}>
        <div className="p-3">
          <p className="mb-2 text-[9px] font-semibold" style={{ color: "#292524" }}>
            Tus lugares
          </p>
          <div className="grid grid-cols-2 gap-2">
            {tables.map((t) => (
              <div
                key={t.name}
                className="flex items-center justify-between rounded-lg px-2.5 py-2"
                style={{ background: "#faf9f7", border: "1px solid #ede9e4" }}
              >
                <div className="flex items-center gap-1.5">
                  <Store className="h-3 w-3" style={{ color: "#a8a29e" }} />
                  <span className="text-[8px] font-medium" style={{ color: "#292524" }}>{t.name}</span>
                </div>
                <span className="rounded-full px-1.5 py-0.5 text-[6px] font-semibold" style={{ background: t.bg, color: t.color }}>
                  {t.state}
                </span>
              </div>
            ))}
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function QrMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-blue-400 to-indigo-400 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: 12, left: 60, right: 60, transform: "rotate(-2deg)" }}>
        <div className="flex flex-col items-center p-4">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-lg"
            style={{ background: "#faf9f7", border: "1px solid #ede9e4" }}
          >
            <QrCode className="h-16 w-16" style={{ color: "#292524" }} />
          </div>
          <p className="mt-2 text-[9px] font-bold" style={{ color: "#292524" }}>Lugar 5</p>
          <p className="text-[7px]" style={{ color: "#a8a29e" }}>Escanea para ordenar</p>
        </div>
      </MiniCard>
    </div>
  );
}

function PideMockup() {
  const items = [
    { name: "Producto A", qty: "x2", price: "$180" },
    { name: "Producto B", qty: "x1", price: "$95" },
    { name: "Producto C", qty: "x3", price: "$210" },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-pink-400 to-rose-300 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: 2, left: 40, right: 40 }}>
        <div className="p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full" style={{ background: "#fce7f3" }} />
            <span className="text-[8px] font-semibold" style={{ color: "#292524" }}>Pedido del cliente</span>
          </div>
          <div className="space-y-1.5">
            {items.map((it) => (
              <div key={it.name} className="flex items-center justify-between">
                <span className="text-[8px]" style={{ color: "#292524" }}>{it.qty} {it.name}</span>
                <span className="text-[8px] font-bold" style={{ color: "#292524" }}>{it.price}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-1.5" style={{ borderColor: "#ede9e4" }}>
              <span className="text-[9px] font-bold" style={{ color: "#292524" }}>Total</span>
              <span className="text-[10px] font-bold" style={{ color: "#059669" }}>$485</span>
            </div>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function EnVivoMockup() {
  const steps = [
    { label: "Recibido", done: true },
    { label: "En proceso", done: true },
    { label: "Listo", done: false },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-amber-300 to-orange-400 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: 10, left: 14, right: 14 }}>
        <div className="p-3">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" style={{ color: "#d97706" }} />
            <span className="text-[9px] font-bold" style={{ color: "#292524" }}>Lugar 2 · en vivo</span>
          </div>
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                    style={{ background: s.done ? "#10b981" : "#e7e5e4" }}
                  >
                    {s.done ? "✓" : i + 1}
                  </div>
                  <span className="text-[6px]" style={{ color: "#57534e" }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="mx-1 h-0.5 flex-1" style={{ background: s.done ? "#10b981" : "#e7e5e4" }} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex justify-between rounded-lg px-2.5 py-1.5" style={{ background: "#faf9f7" }}>
            <span className="text-[7px]" style={{ color: "#a8a29e" }}>Pagado $200 de $485</span>
            <span className="text-[7px] font-bold" style={{ color: "#d97706" }}>Falta $285</span>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function DivideMockup() {
  const people = [
    { name: "Persona 1", amount: "$243" },
    { name: "Persona 2", amount: "$242" },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-violet-400 to-purple-400 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: 20, left: 24, right: 24 }}>
        <div className="p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" style={{ color: "#8b5cf6" }} />
            <span className="text-[9px] font-bold" style={{ color: "#292524" }}>Dividir cuenta</span>
          </div>
          <div className="space-y-1.5">
            {people.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded-lg px-2.5 py-2"
                style={{ background: "#f5f3ff", border: "1px solid #ede9fe" }}
              >
                <span className="text-[8px] font-medium" style={{ color: "#292524" }}>{p.name}</span>
                <span className="text-[9px] font-bold" style={{ color: "#8b5cf6" }}>{p.amount}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[7px]" style={{ color: "#a8a29e" }}>
            Cada quien paga su parte desde su celular
          </p>
        </div>
      </MiniCard>
    </div>
  );
}

// ─── Slides ───────────────────────────────────────────────────
const slides = [
  {
    id: "que-es",
    title: "Tus lugares,\nen orden",
    description:
      "Un lugar es cada punto donde atiendes a un cliente — una mesa, una bahía de autolavado, un puesto. Aquí ves de un vistazo cuáles están libres y cuáles en uso.",
    Mockup: QueEsMockup,
  },
  {
    id: "qr",
    title: "Cada lugar,\nsu código QR",
    description:
      "Al crear un lugar se genera su código QR único. Descárgalo, imprímelo y pégalo. Tus clientes lo escanean con la cámara — sin descargar ninguna app.",
    Mockup: QrMockup,
  },
  {
    id: "pide",
    title: "El cliente\npide solo",
    description:
      "Al escanear, el cliente ve tus productos, arma su pedido y lo envía desde su celular. Varias personas en el mismo lugar suman a la misma cuenta.",
    Mockup: PideMockup,
  },
  {
    id: "en-vivo",
    title: "Ves todo\nen tiempo real",
    description:
      "Cada pedido aparece al instante. Avanzas su estado (recibido → en proceso → listo) y ves cuánto se ha pagado y cuánto falta, en vivo.",
    Mockup: EnVivoMockup,
  },
  {
    id: "divide",
    title: "Dividir y cobrar\nsin líos",
    description:
      "Si son varios, pueden dividir la cuenta y cada quien paga su parte desde su teléfono. El lugar se libera solo cuando la cuenta queda saldada.",
    Mockup: DivideMockup,
  },
] as const;

// ─── Overlay ──────────────────────────────────────────────────
export function TablesOnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const navigating = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TABLES_ONBOARDING_KEY)) setVisible(true);
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
      localStorage.setItem(TABLES_ONBOARDING_KEY, "1");
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
      aria-label="Tutorial de Lugares"
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
