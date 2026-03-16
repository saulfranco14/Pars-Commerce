"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  HandMetal,
  CreditCard,
  SplitSquareHorizontal,
  Lock,
  Repeat,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CHECKOUT_GUIDE_KEY } from "@/features/onboarding/constants";

interface CheckoutGuideProps {
  accentColor: string;
  hasInstallments: boolean;
  hasRecurring: boolean;
}

interface SlideItem {
  id: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  tip?: string;
  tags: string[];
}

const allSlides: SlideItem[] = [
  {
    id: "bienvenida",
    icon: HandMetal,
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    title: "Formas de pago disponibles",
    description:
      "Este negocio ofrece diferentes formas de pago. Te explicamos cada una para que elijas la que más te convenga.",
    tags: ["always"],
  },
  {
    id: "pago-unico",
    icon: CreditCard,
    iconBg: "#d1fae5",
    iconColor: "#059669",
    title: "Pago único",
    description:
      "Paga el total de tu compra de una sola vez. Tu pedido se genera al instante y pasas a recogerlo.",
    tip: "La opción más rápida y directa.",
    tags: ["always"],
  },
  {
    id: "cuotas",
    icon: SplitSquareHorizontal,
    iconBg: "#ede9fe",
    iconColor: "#7c3aed",
    title: "Pago en cuotas",
    description:
      "Divide tu compra en varios pagos (2, 3, 6 o más). Se cobra automáticamente a tu tarjeta según la frecuencia que elijas.",
    tip: "Ideal para compras grandes que prefieras pagar poco a poco.",
    tags: ["installments"],
  },
  {
    id: "cuotas-mp",
    icon: Lock,
    iconBg: "#e0f2fe",
    iconColor: "#0284c7",
    title: "Cuotas seguras con MercadoPago",
    description:
      "Al elegir cuotas, se abrirá MercadoPago para guardar tu tarjeta de forma segura. Los cobros se harán automáticamente cada periodo.",
    tip: "Puede incluir una tarifa de servicio en cada cobro.",
    tags: ["installments"],
  },
  {
    id: "recurrente",
    icon: Repeat,
    iconBg: "#fce7f3",
    iconColor: "#db2777",
    title: "Compra recurrente",
    description:
      "Se cobra periódicamente sin fecha de fin. Recibes tus productos regularmente sin tener que volver a comprar.",
    tip: "Puedes cancelar cuando quieras, sin penalización.",
    tags: ["recurring"],
  },
  {
    id: "recurrente-mp",
    icon: Smartphone,
    iconBg: "#fef3c7",
    iconColor: "#d97706",
    title: "Suscripción con MercadoPago",
    description:
      "Autorizas tu tarjeta una sola vez vía MercadoPago. Cada periodo se cobra automáticamente y recibes una notificación.",
    tags: ["recurring"],
  },
  {
    id: "seguridad",
    icon: ShieldCheck,
    iconBg: "#d1fae5",
    iconColor: "#059669",
    title: "Pago 100% seguro",
    description:
      "Todos los pagos se procesan por MercadoPago con cifrado de datos. Nunca vemos ni almacenamos los datos de tu tarjeta.",
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
  const SlideIcon = slide.icon;
  const isLast = current === slides.length - 1;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
      {/* Accent top bar */}
      <div className="h-1" style={{ backgroundColor: accentColor }} />

      {/* Close button */}
      <button
        onClick={dismiss}
        className="absolute right-3 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label="Cerrar guía"
      >
        <X className="h-4 w-4" />
      </button>

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="px-5 pb-5 pt-4"
      >
        {/* Header label */}
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: accentColor }}>
          Guía de pago · {current + 1}/{slides.length}
        </p>

        {/* Icon + Content */}
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: slide.iconBg }}
          >
            <SlideIcon className="h-6 w-6" style={{ color: slide.iconColor }} />
          </div>
          <div className="min-w-0 flex-1 pr-5">
            <h3 className="text-base font-bold text-gray-900">{slide.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              {slide.description}
            </p>
            {slide.tip && (
              <p
                className="mt-2 rounded-lg px-3 py-2 text-xs font-medium leading-snug"
                style={{ backgroundColor: `${accentColor}0a`, color: accentColor }}
              >
                {slide.tip}
              </p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 20 : 8,
                  backgroundColor: i === current ? accentColor : "#e5e7eb",
                }}
                aria-label={`Ir al paso ${i + 1}`}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2">
            {current > 0 && (
              <button
                onClick={prev}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={next}
              className="flex h-9 min-w-[90px] items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              {isLast ? "¡Listo!" : "Siguiente"}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
