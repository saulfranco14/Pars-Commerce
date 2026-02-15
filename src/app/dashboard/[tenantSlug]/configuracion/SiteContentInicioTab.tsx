"use client";

import { Check } from "lucide-react";
import type { SitePageContent, SitePageCard, SitePagePurchaseStep, SitePageFaqItem } from "@/types/tenantSitePages";
import { FormSection, inputClass, btnPrimary } from "./SiteContentFormSection";
import { CardIconSelector } from "./CardIconSelector";

interface Props {
  content: SitePageContent;
  onChange: (c: SitePageContent) => void;
  onSave: () => void;
  loading: boolean;
}

export function SiteContentInicioTab({ content, onChange, onSave, loading }: Props) {
  const cards = (content.cards ?? Array(4).fill(null)).slice(0, 4);
  const purchaseProcess = (content.purchase_process ?? Array(3).fill(null)).slice(0, 3);
  const faqItems = content.faq_items ?? [];

  function setCards(updater: (prev: (SitePageCard | null)[]) => (SitePageCard | null)[]) {
    const next = updater(cards);
    onChange({ ...content, cards: next });
  }

  function setPurchaseProcess(updater: (prev: (SitePagePurchaseStep | null)[]) => (SitePagePurchaseStep | null)[]) {
    const next = updater(purchaseProcess);
    onChange({ ...content, purchase_process: next });
  }

  function setFaqItems(updater: (prev: SitePageFaqItem[]) => SitePageFaqItem[]) {
    onChange({ ...content, faq_items: updater(faqItems) });
  }

  return (
    <div className="space-y-8">
      <FormSection
        title="Encabezado principal"
        description="Título, subtítulo y texto de bienvenida que aparecen al inicio de la página."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="inicio-title" className="block text-sm font-medium text-muted-foreground">
              Título principal <span className="text-muted-foreground/70">(máx. 80 caracteres)</span>
            </label>
            <input
              id="inicio-title"
              type="text"
              value={content.title ?? ""}
              onChange={(e) => onChange({ ...content, title: e.target.value })}
              maxLength={80}
              className={inputClass}
              placeholder="Ej. Bienvenido a Mi Tienda"
            />
          </div>
          <div>
            <label htmlFor="inicio-subtitle" className="block text-sm font-medium text-muted-foreground">
              Subtítulo
            </label>
            <input
              id="inicio-subtitle"
              type="text"
              value={content.subtitle ?? ""}
              onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
              maxLength={120}
              className={inputClass}
              placeholder="Una frase breve debajo del título"
            />
          </div>
          <div>
            <label htmlFor="inicio-welcome" className="block text-sm font-medium text-muted-foreground">
              Texto de bienvenida
            </label>
            <textarea
              id="inicio-welcome"
              value={content.welcome_text ?? ""}
              onChange={(e) => onChange({ ...content, welcome_text: e.target.value })}
              maxLength={500}
              rows={3}
              className={inputClass}
              placeholder="1–2 párrafos presentando tu negocio"
            />
          </div>
          <div>
            <label htmlFor="inicio-hero" className="block text-sm font-medium text-muted-foreground">
              URL imagen de fondo (hero)
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Imagen que cubre la zona superior. Usa una URL pública (ej. desde Imgur o tu host).
            </p>
            <input
              id="inicio-hero"
              type="url"
              value={content.hero_image_url ?? ""}
              onChange={(e) => onChange({ ...content, hero_image_url: e.target.value })}
              className={inputClass}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Tarjetas de valor"
        description="Hasta 4 tarjetas que destacan beneficios (calidad, discreción, entrega, etc.) en la sección principal."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {cards.map((card: SitePageCard | null, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-5 shadow-sm transition-colors duration-200 hover:border-accent/40"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Tarjeta {i + 1}
              </div>

              <div>
                <label htmlFor={`card-icon-${i}`} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Icono
                </label>
                <CardIconSelector
                  id={`card-icon-${i}`}
                  value={card?.icon}
                  onChange={(icon) => {
                    setCards((prev) => {
                      const next = [...prev];
                      while (next.length <= i) next.push({});
                      next[i] = { ...next[i], icon };
                      return next;
                    });
                  }}
                />
              </div>

              <div>
                <label htmlFor={`card-title-${i}`} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Título
                </label>
                <input
                  id={`card-title-${i}`}
                  type="text"
                  value={card?.title ?? ""}
                  onChange={(e) => {
                    setCards((prev) => {
                      const next = [...prev];
                      while (next.length <= i) next.push({});
                      next[i] = { ...next[i], title: e.target.value };
                      return next;
                    });
                  }}
                  className={inputClass}
                  placeholder="Ej. Calidad garantizada"
                />
              </div>

              <div>
                <label htmlFor={`card-desc-${i}`} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Descripción
                </label>
                <textarea
                  id={`card-desc-${i}`}
                  value={card?.description ?? ""}
                  onChange={(e) => {
                    setCards((prev) => {
                      const next = [...prev];
                      while (next.length <= i) next.push({});
                      next[i] = { ...next[i], description: e.target.value };
                      return next;
                    });
                  }}
                  rows={3}
                  className={inputClass}
                  placeholder="Breve explicación del beneficio"
                />
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Proceso de compra"
        description="Los 3 pasos que explican cómo comprar. Aparecen como: Selecciona → Pide → Recibe."
      >
        <div className="space-y-4">
          {purchaseProcess.map((step: SitePagePurchaseStep | null, i) => (
            <div key={i} className="flex flex-col gap-3 py-4 border-b border-border last:border-b-0">
              <div>
                <label htmlFor={`step-title-${i}`} className="block text-xs font-medium text-muted-foreground">
                  Paso {i + 1} – Título
                </label>
                <input
                  id={`step-title-${i}`}
                  type="text"
                  value={step?.title ?? ""}
                  onChange={(e) => {
                    setPurchaseProcess((prev) => {
                      const next = [...prev];
                      while (next.length <= i) next.push({});
                      next[i] = { ...next[i], title: e.target.value };
                      return next;
                    });
                  }}
                  className={inputClass}
                  placeholder="Ej. Selecciona tu producto"
                />
              </div>
              <div>
                <label htmlFor={`step-desc-${i}`} className="block text-xs font-medium text-muted-foreground">
                  Descripción
                </label>
                <textarea
                  id={`step-desc-${i}`}
                  value={step?.description ?? ""}
                  onChange={(e) => {
                    setPurchaseProcess((prev) => {
                      const next = [...prev];
                      while (next.length <= i) next.push({});
                      next[i] = { ...next[i], description: e.target.value };
                      return next;
                    });
                  }}
                  rows={2}
                  className={inputClass}
                  placeholder="Breve explicación del paso"
                />
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Banner de entrega discreta"
        description="Mensaje corto que se muestra en una franja entre secciones."
      >
        <input
          id="inicio-banner"
          type="text"
          value={content.delivery_banner_text ?? ""}
          onChange={(e) => onChange({ ...content, delivery_banner_text: e.target.value })}
          maxLength={200}
          className={inputClass}
          placeholder="Ej. Entrega discreta: empaque sin marca identificable"
        />
      </FormSection>

      <FormSection
        title="Preguntas frecuentes"
        description="Preguntas y respuestas expandibles al final de la página de inicio."
      >
        <div className="space-y-4">
          {faqItems.map((item, i) => (
            <div key={i} className="flex flex-col gap-3 py-4 border-b border-border last:border-b-0">
              <div>
                <label htmlFor={`faq-q-${i}`} className="block text-xs font-medium text-muted-foreground">
                  Pregunta
                </label>
                <input
                  id={`faq-q-${i}`}
                  type="text"
                  value={item.question ?? ""}
                  onChange={(e) => {
                    setFaqItems((prev) => {
                      const arr = [...prev];
                      arr[i] = { ...arr[i], question: e.target.value };
                      return arr;
                    });
                  }}
                  className={inputClass}
                  placeholder="Ej. ¿Cómo realizo mi pedido?"
                />
              </div>
              <div>
                <label htmlFor={`faq-a-${i}`} className="block text-xs font-medium text-muted-foreground">
                  Respuesta
                </label>
                <textarea
                  id={`faq-a-${i}`}
                  value={item.answer ?? ""}
                  onChange={(e) => {
                    setFaqItems((prev) => {
                      const arr = [...prev];
                      arr[i] = { ...arr[i], answer: e.target.value };
                      return arr;
                    });
                  }}
                  rows={2}
                  className={inputClass}
                  placeholder="Explica el proceso o la información"
                />
              </div>
              <button
                type="button"
                onClick={() => setFaqItems((prev) => prev.filter((_, j) => j !== i))}
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2"
              >
                Eliminar pregunta
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFaqItems((prev) => [...prev, { question: "", answer: "" }])}
            className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:ring-offset-2"
          >
            + Agregar pregunta
          </button>
        </div>
      </FormSection>

      <div className="flex justify-end border-t border-border pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className={btnPrimary}
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          {loading ? "Guardando…" : "Guardar Inicio"}
        </button>
      </div>
    </div>
  );
}
