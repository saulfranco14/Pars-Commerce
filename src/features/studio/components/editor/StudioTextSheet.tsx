"use client";
import { useEffect, useRef } from "react";
import { Check, ExternalLink, Type } from "lucide-react";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";
import { STUDIO_TAGLINES } from "../../constants/studio";
import { studioValidity } from "../../helpers/scene";
import {
  setStudioHeadline,
  setStudioTagline,
  studioHeadline,
  studioTagline,
} from "../../helpers/sceneStyle";
import { studioTextFields } from "../../validations/studioTextFields";
import type { StudioTextSheetProps } from "../../interfaces/ui";

export function StudioTextSheet({
  open,
  onClose,
  disabled,
  scene,
  source,
  catalogHref,
  onApply,
}: StudioTextSheetProps) {
  const form = useSchemaForm<{ headline: string; tagline: string }>(
    studioTextFields,
    async (values) => {
      onApply(
        setStudioTagline(
          setStudioHeadline(scene, source, values.headline),
          values.tagline,
        ),
      );
      onClose();
    },
  );
  const { reset } = form,
    latest = useRef(scene);
  latest.current = scene;
  useEffect(() => {
    if (open)
      reset({
        headline: studioHeadline(latest.current),
        tagline: studioTagline(latest.current),
      });
  }, [open, reset]);
  const tagline = form.watch("tagline"),
    details = [source.conditions, studioValidity(source), source.period]
      .filter(Boolean)
      .join(" · ");
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Textos del anuncio"
      icon={Type}
      footer={
        <button
          type="submit"
          form="studio-text-form"
          disabled={disabled}
          className={`${adminActionButtonPrimary} w-full`}
        >
          <Check className="h-4 w-4" />
          Listo
        </button>
      }
    >
      <form
        id="studio-text-form"
        onSubmit={form.handleSubmit(form.submit)}
        className="space-y-5 pb-3"
      >
        <FormInput
          label="Nombre en el anuncio"
          disabled={disabled}
          maxLength={120}
          {...form.register("headline")}
          error={form.errors.headline?.message}
        />
        {(source.priceLabel || source.badge) && (
          <div className="space-y-1 rounded-xl bg-border-soft/60 p-3 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Precio
            </p>
            <p className="font-bold">{source.badge || source.priceLabel}</p>
            {details && (
              <p className="text-xs text-muted-foreground">{details}</p>
            )}
            <p className="text-xs leading-5 text-muted-foreground">
              Viene de tu catálogo; si cambia allá, cambia aquí.
            </p>
            {catalogHref && (
              <a
                href={catalogHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent"
              >
                <ExternalLink className="h-4 w-4" />
                Catálogo
              </a>
            )}
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Frase corta
          </p>
          <div className="flex flex-wrap gap-2">
            {STUDIO_TAGLINES.map((phrase) => (
              <button
                key={phrase}
                type="button"
                disabled={disabled}
                aria-pressed={tagline === phrase}
                onClick={() =>
                  form.setValue("tagline", tagline === phrase ? "" : phrase, {
                    shouldValidate: true,
                  })
                }
                className={`min-h-10 cursor-pointer rounded-full border px-3 text-sm font-semibold transition-colors ${tagline === phrase ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface"}`}
              >
                {phrase}
              </button>
            ))}
          </div>
          <FormInput
            label="O escribe la tuya"
            disabled={disabled}
            maxLength={60}
            {...form.register("tagline")}
            error={form.errors.tagline?.message}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Una invitación corta hace que te escriban. Déjala vacía si no la
            quieres.
          </p>
        </div>
        {form.submitError && (
          <Notification tone="error" message={form.submitError} />
        )}
      </form>
    </FormSheet>
  );
}
