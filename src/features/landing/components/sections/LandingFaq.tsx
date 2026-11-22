"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { LandingSection } from "@/features/landing/components/shared/LandingSection";
import { SectionHeader } from "@/features/landing/components/shared/SectionHeader";

import { FAQS } from "@/features/landing/constants/faqs";

export function LandingFaq({
  studioEnabled = false,
}: {
  studioEnabled?: boolean;
}) {
  const faqs = studioEnabled
    ? [
        ...FAQS,
        {
          question: "¿Tlaco Gratis incluye Studio?",
          answer:
            "El registro y Tlaco Gratis son independientes. Studio es un complemento de pago por negocio: incluye el editor y las exportaciones. Las generaciones de IA consumen Tlacos y requieren membresía vigente y saldo. Puedes explorar Studio antes de contratar.",
        },
      ]
    : FAQS;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <LandingSection id="preguntas" width="max-w-3xl">
      <SectionHeader
        eyebrow="Preguntas frecuentes"
        title="Lo que más nos preguntan."
        lead="Resolvemos tus dudas antes de empezar."
      />

      <div className="mt-10 space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`rounded-2xl border bg-surface transition-colors duration-200 ${
                isOpen ? "border-accent/30" : "border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex min-h-14 w-full cursor-pointer items-center justify-between rounded-2xl px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
              >
                <span className="pr-4 text-[15px] font-semibold text-foreground sm:text-base">
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
    </LandingSection>
  );
}
