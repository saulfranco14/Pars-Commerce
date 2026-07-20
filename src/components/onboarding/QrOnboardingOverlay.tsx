"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, X, QrCode, CreditCard, Store, Share2 } from "lucide-react";
import { MiniCard } from "@/features/onboarding/components/MiniCard";
import { QR_ONBOARDING_KEY } from "@/features/onboarding/constants";

// ─── Slide mockups ────────────────────────────────────────────

function IntroMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-accent/60 to-pink-300 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: 26, left: 56, right: 56 }}>
        <div className="flex flex-col items-center p-5">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-xl"
            style={{ background: "#faf9f7", border: "1px solid #ede9e4" }}
          >
            <QrCode className="h-16 w-16" style={{ color: "#292524" }} />
          </div>
          <p className="mt-2.5 text-[9px] font-bold" style={{ color: "#292524" }}>
            Un código, mil usos
          </p>
        </div>
      </MiniCard>
    </div>
  );
}

function DosTiposMockup() {
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-blue-400 to-indigo-400 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: 4, left: 12, width: 118, transform: "rotate(-2deg)" }}>
        <div className="p-3">
          <Store className="h-5 w-5" style={{ color: "#3b82f6" }} />
          <p className="mt-1.5 text-[9px] font-bold" style={{ color: "#292524" }}>Mesa</p>
          <p className="text-[7px]" style={{ color: "#a8a29e" }}>
            El cliente ve tu menú y ordena
          </p>
        </div>
      </MiniCard>
      <MiniCard className="absolute" style={{ top: 70, right: 12, width: 118, transform: "rotate(2.5deg)" }}>
        <div className="p-3">
          <CreditCard className="h-5 w-5" style={{ color: "#10b981" }} />
          <p className="mt-1.5 text-[9px] font-bold" style={{ color: "#292524" }}>Cobro libre</p>
          <p className="text-[7px]" style={{ color: "#a8a29e" }}>
            El cliente escanea y paga un monto
          </p>
        </div>
      </MiniCard>
    </div>
  );
}

function CobroMockup() {
  const presets = ["$50", "$100", "$200"];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-emerald-400 to-green-400 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: 8, left: 44, right: 44 }}>
        <div className="p-4">
          <p className="text-center text-[8px]" style={{ color: "#a8a29e" }}>Pagar a</p>
          <p className="text-center text-[11px] font-bold" style={{ color: "#292524" }}>Tu Negocio</p>
          <div className="mt-2.5 flex justify-center gap-1.5">
            {presets.map((p, i) => (
              <span
                key={p}
                className="rounded-lg px-2.5 py-1.5 text-[9px] font-bold"
                style={{
                  background: i === 1 ? "#d1fae5" : "#faf9f7",
                  color: i === 1 ? "#059669" : "#292524",
                  border: `1px solid ${i === 1 ? "#a7f3d0" : "#ede9e4"}`,
                }}
              >
                {p}
              </span>
            ))}
          </div>
          <div
            className="mt-2.5 rounded-lg py-2 text-center text-[9px] font-bold text-white"
            style={{ background: "#10b981" }}
          >
            Pagar $100
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function ComparteMockup() {
  const channels = ["Imprimir", "Copiar enlace", "Probar"];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-linear-to-br from-violet-400 to-purple-400 opacity-20 blur-3xl" />
      </div>
      <MiniCard className="absolute" style={{ top: 20, left: 20, right: 20 }}>
        <div className="p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5" style={{ color: "#8b5cf6" }} />
            <span className="text-[9px] font-bold" style={{ color: "#292524" }}>Compártelo como quieras</span>
          </div>
          <div className="space-y-1.5">
            {channels.map((c) => (
              <div
                key={c}
                className="rounded-lg px-2.5 py-2 text-[8px] font-medium"
                style={{ background: "#faf9f7", border: "1px solid #ede9e4", color: "#292524" }}
              >
                {c}
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[7px]" style={{ color: "#a8a29e" }}>
            Descárgalo en PNG y pégalo donde lo verán
          </p>
        </div>
      </MiniCard>
    </div>
  );
}

// ─── Slides ───────────────────────────────────────────────────
const slides = [
  {
    id: "intro",
    title: "Cobra con\nun código QR",
    description:
      "Genera códigos QR reutilizables para que tus clientes ordenen o te paguen escaneando con su celular. Sin terminal, sin app, sin complicaciones.",
    Mockup: IntroMockup,
  },
  {
    id: "dos-tipos",
    title: "Dos tipos,\ntú eliges",
    description:
      "QR de mesa: el cliente ve tu menú y arma su pedido. QR de cobro libre: el cliente escanea y paga un monto directo, sin menú — ideal para mostrador o propinas.",
    Mockup: DosTiposMockup,
  },
  {
    id: "cobro",
    title: "Cobro libre,\nal instante",
    description:
      "Pon un monto sugerido o deja que el cliente teclee cuánto. Escanea, paga en línea, y listo. Perfecto para un cobro rápido sin abrir una cuenta.",
    Mockup: CobroMockup,
  },
  {
    id: "comparte",
    title: "Imprímelo\ny compártelo",
    description:
      "Descarga cualquier QR como imagen, imprímelo y pégalo donde tus clientes lo vean. O copia su enlace y compártelo por WhatsApp o redes.",
    Mockup: ComparteMockup,
  },
] as const;

// ─── Overlay ──────────────────────────────────────────────────
export function QrOnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const navigating = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(QR_ONBOARDING_KEY)) setVisible(true);
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
      localStorage.setItem(QR_ONBOARDING_KEY, "1");
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
      aria-label="Tutorial de Códigos QR"
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
