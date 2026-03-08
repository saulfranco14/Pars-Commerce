"use client";

import { useState, useRef } from "react";
import { Check, Trash2, ImagePlus } from "lucide-react";
import Image from "next/image";
import type {
  SitePageCard,
  SitePagePurchaseStep,
  SitePageFaqItem,
} from "@/types/tenantSitePages";
import { FormSection } from "./SiteContentFormSection";
import { inputForm } from "@/components/ui/inputClasses";
import { btnPrimary } from "@/components/ui/buttonClasses";
import { CardIconSelector } from "./CardIconSelector";
import { validateImageSize, handleUploadError } from "@/lib/uploadUtils";
import type { SiteContentTabProps } from "@/features/configuracion/interfaces/sections";

export function SiteContentInicioTab({
  tenantId = "",
  content,
  onChange,
  onSave,
  loading,
  narrow,
}: SiteContentTabProps) {
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroDeleting, setHeroDeleting] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  async function handleHeroFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeError = validateImageSize(file);
    if (sizeError) {
      setHeroError(sizeError);
      if (heroInputRef.current) heroInputRef.current.value = "";
      return;
    }

    setHeroError(null);
    setHeroUploading(true);
    try {
      const { uploadHeroImage } = await import("@/lib/supabase/storage");
      const url = await uploadHeroImage(file, tenantId, content.hero_image_url);
      onChange({ ...content, hero_image_url: url });
    } catch (err: unknown) {
      setHeroError(handleUploadError(err));
    } finally {
      setHeroUploading(false);
      if (heroInputRef.current) heroInputRef.current.value = "";
    }
  }

  async function handleHeroDelete() {
    if (!content.hero_image_url) return;
    setHeroError(null);
    setHeroDeleting(true);
    try {
      const { deleteHeroImage } = await import("@/lib/supabase/storage");
      await deleteHeroImage(content.hero_image_url);
      onChange({ ...content, hero_image_url: undefined });
    } catch (err: unknown) {
      setHeroError(handleUploadError(err, "Error al eliminar la imagen."));
    } finally {
      setHeroDeleting(false);
    }
  }
  const cards = (content.cards ?? Array(4).fill(null)).slice(0, 4);
  const purchaseProcess = (content.purchase_process ?? Array(3).fill(null)).slice(0, 3);
  const faqItems = content.faq_items ?? [];

  function setCards(updater: (prev: (SitePageCard | null)[]) => (SitePageCard | null)[]) {
    const next = updater(cards);
    onChange({ ...content, cards: next.map((c) => c ?? {}) });
  }

  function setPurchaseProcess(updater: (prev: (SitePagePurchaseStep | null)[]) => (SitePagePurchaseStep | null)[]) {
    const next = updater(purchaseProcess);
    onChange({ ...content, purchase_process: next.map((s) => s ?? {}) });
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
              className={inputForm}
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
              className={inputForm}
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
              className={inputForm}
              placeholder="1–2 párrafos presentando tu negocio"
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                Imagen de fondo (hero)
              </label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Imagen que cubre la zona superior de tu sitio. JPG, PNG o WebP, máx. 12 MB.
              </p>
            </div>

            {content.hero_image_url ? (
              <div className="space-y-2">
                <div className="relative w-full overflow-hidden rounded-lg border border-border" style={{ aspectRatio: "16/5" }}>
                  <Image
                    src={content.hero_image_url}
                    alt="Vista previa hero"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => heroInputRef.current?.click()}
                    disabled={heroUploading || heroDeleting}
                    className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-border-soft disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ImagePlus className="h-4 w-4" aria-hidden />
                    {heroUploading ? "Subiendo…" : "Cambiar imagen"}
                  </button>
                  <button
                    type="button"
                    onClick={handleHeroDelete}
                    disabled={heroUploading || heroDeleting}
                    className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    {heroDeleting ? "Eliminando…" : "Eliminar"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => heroInputRef.current?.click()}
                disabled={heroUploading}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface py-8 text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:bg-border-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ImagePlus className="h-8 w-8 text-muted-foreground/50" aria-hidden />
                <span>{heroUploading ? "Subiendo imagen…" : "Haz clic para subir imagen"}</span>
                <span className="text-xs">JPG, PNG, WebP · máx. 12 MB</span>
              </button>
            )}

            <input
              ref={heroInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleHeroFile}
              disabled={heroUploading || heroDeleting}
              className="sr-only"
            />
            {heroError && <p className="text-sm text-red-600">{heroError}</p>}
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Tarjetas de valor"
        description="Hasta 4 tarjetas que destacan beneficios (calidad, discreción, entrega, etc.) en la sección principal."
      >
        <div className={`grid gap-6 ${narrow ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
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
                  className={inputForm}
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
                  className={inputForm}
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
                  className={inputForm}
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
                  className={inputForm}
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
          className={inputForm}
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
                  className={inputForm}
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
                  className={inputForm}
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
