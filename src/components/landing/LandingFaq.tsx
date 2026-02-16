"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    question: "Necesito conocimientos tecnicos para usar Pars Commerce?",
    answer:
      "No. Todo es visual e intuitivo. Creas tu cuenta, agregas productos con fotos y precios, y tu tienda se genera automaticamente. No necesitas saber programar.",
  },
  {
    question: "Cuanto cuesta usar la plataforma?",
    answer:
      "Pars Commerce es gratis para empezar. Puedes crear tu negocio, agregar productos y recibir pedidos sin costo. Solo pagas las comisiones de MercadoPago por cada venta.",
  },
  {
    question: "Puedo personalizar mi tienda?",
    answer:
      "Si. Puedes elegir los colores de tu tienda, subir tu logo, crear paginas personalizadas y configurar tu catalogo como quieras. Cada negocio tiene su URL unica.",
  },
  {
    question: "Como funcionan los pagos?",
    answer:
      "Los pagos estan integrados con MercadoPago. Tus clientes pueden pagar con tarjeta de credito, debito y otros metodos disponibles. El dinero llega directamente a tu cuenta de MercadoPago.",
  },
  {
    question: "Puedo vender servicios ademas de productos?",
    answer:
      "Si. La plataforma soporta tanto productos fisicos como servicios. Ideal para negocios que ofrecen lavado, rentas, consultoria o cualquier tipo de servicio.",
  },
  {
    question: "Mis datos estan seguros?",
    answer:
      "Si. Usamos Supabase con encriptacion y autenticacion segura. Los datos de pago los maneja MercadoPago directamente, nunca pasan por nuestros servidores.",
  },
] as const;

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-1 w-10 rounded-full bg-accent"
            aria-hidden
          />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Preguntas frecuentes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Resolvemos tus dudas antes de empezar.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-xl border transition-colors duration-200 ${
                  isOpen
                    ? "border-accent/30"
                    : "border-border bg-surface hover:border-border-soft dark:bg-surface-raised"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset rounded-xl"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="pr-4 text-sm font-medium text-foreground sm:text-[15px]">
                    {faq.question}
                  </span>
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                      isOpen
                        ? "bg-accent/15 text-accent"
                        : "bg-border-soft/50 text-muted-foreground"
                    }`}
                  >
                    {isOpen ? (
                      <Minus className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </div>
                </button>
                <div
                  id={`faq-answer-${i}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
