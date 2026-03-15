"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { CHECKOUT_GUIDE_KEY } from "@/features/onboarding/constants";

interface CheckoutGuideProps {
  accentColor: string;
  hasInstallments: boolean;
  hasRecurring: boolean;
}

const allSlides = [
  {
    id: "bienvenida",
    emoji: "👋",
    title: "¡Bienvenido!",
    description: "Te explicamos las formas de pago disponibles para que elijas la que más te convenga.",
    tags: ["installments", "recurring", "always"],
  },
  {
    id: "pago-unico",
    emoji: "💳",
    title: "Pago único",
    description: "Paga el total de tu compra de una sola vez. Tu pedido se genera al instante y pasas a recogerlo.",
    tags: ["always"],
  },
  {
    id: "cuotas",
    emoji: "📦",
    title: "Pago en cuotas",
    description: "Divide tu compra en varios pagos (2, 3, 6 o más). Se cobra automáticamente a tu tarjeta según la frecuencia que elijas: semanal, quincenal o mensual.",
    tags: ["installments"],
  },
  {
    id: "cuotas-mp",
    emoji: "🔒",
    title: "Cuotas con MercadoPago",
    description: "Al elegir cuotas, se abrirá MercadoPago para guardar tu tarjeta de forma segura. Los cobros siguientes se harán automáticamente. Puedes ver un pequeño cargo por servicio.",
    tags: ["installments"],
  },
  {
    id: "recurrente",
    emoji: "🔄",
    title: "Pago recurrente",
    description: "Se cobra periódicamente sin fecha de fin. Ideal si siempre compras lo mismo. Puedes cancelar cuando quieras sin penalización.",
    tags: ["recurring"],
  },
  {
    id: "recurrente-mp",
    emoji: "📱",
    title: "Suscripción con MercadoPago",
    description: "Autorizas tu tarjeta una sola vez vía MercadoPago. Cada periodo se cobra automáticamente. Recibes notificaciones de cada cobro.",
    tags: ["recurring"],
  },
  {
    id: "seguridad",
    emoji: "🛡️",
    title: "Pago 100% seguro",
    description: "Todos los pagos se procesan por MercadoPago con cifrado de datos. Nosotros nunca vemos ni almacenamos los datos de tu tarjeta.",
    tags: ["installments", "recurring"],
  },
];

export function CheckoutGuide({
  accentColor,
  hasInstallments,
  hasRecurring,
}: CheckoutGuideProps) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const slides = allSlides.filter((s) => {
    if (s.tags.includes("always")) return true;
    if (s.tags.includes("installments") && hasInstallments) return true;
    if (s.tags.includes("recurring") && hasRecurring) return true;
    return false;
  });

  useEffect(() => {
    if (!hasInstallments && !hasRecurring) return;
    try {
      if (!localStorage.getItem(CHECKOUT_GUIDE_KEY)) setVisible(true);
    } catch {
      /* storage blocked */
    }
  }, [hasInstallments, hasRecurring]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(CHECKOUT_GUIDE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  const next = useCallback(() => {
    if (current === slides.length - 1) {
      dismiss();
      return;
    }
    setCurrent((c) => c + 1);
  }, [current, slides.length, dismiss]);

  const prev = useCallback(() => {
    setCurrent((c) => Math.max(0, c - 1));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(dx) > 48) {
        if (dx < 0) next();
        else prev();
      }
      touchStartX.current = null;
    },
    [next, prev],
  );

  if (!visible || slides.length === 0) return null;

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 shadow-lg"
      style={{ borderColor: accentColor, backgroundColor: `${accentColor}08` }}
    >
      {/* Close button */}
      <button
        onClick={dismiss}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label="Cerrar guía"
      >
        <X className="h-4 w-4" />
      </button>

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="px-5 pb-4 pt-5"
      >
        {/* Emoji + Content */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            {slide.emoji}
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <h3 className="text-sm font-bold text-gray-900">{slide.title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
              {slide.description}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 16 : 6,
                  backgroundColor: i === current ? accentColor : "#d6d3d1",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {current > 0 && (
              <button
                onClick={prev}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={next}
              className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              {isLast ? "¡Entendido!" : "Siguiente"}
              {isLast ? null : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <p className="mt-2 text-right text-[11px] text-gray-400">
          {current + 1} de {slides.length}
        </p>
      </div>
    </div>
  );
}
