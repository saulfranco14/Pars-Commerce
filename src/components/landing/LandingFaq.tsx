"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-accent" aria-hidden />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Preguntas frecuentes
          </h2>
        </div>

        <div className="mt-12">
          {FAQS.map((faq, i) => {
            const isOpen = open.has(i);
            return (
              <div key={i} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="flex w-full cursor-pointer items-center justify-between py-5 text-left focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="pr-4 text-sm font-medium text-foreground sm:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                <div
                  id={`faq-answer-${i}`}
                  className={`grid transition-[grid-template-rows] duration-300 ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
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
