"use client";
import { useEffect, useRef } from "react";
import { Check, ExternalLink, Loader2, Sparkles, Type } from "lucide-react";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { useStudioCopyIdeas } from "../../hooks/useStudioCopyIdeas";
import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import {
  adminActionButtonAi,
  adminActionButtonPrimary,
} from "@/components/admin/actionButtonClasses";
import { STUDIO_NOTES } from "../../constants/studio";
import {
  setStudioPhrase,
  setStudioTagline,
  studioPhrase,
  studioTagline,
} from "../../helpers/sceneStyle";
import { studioTextFields } from "../../validations/studioTextFields";
import type { StudioTextSheetProps } from "../../interfaces/ui";

const chip = (on: boolean) =>
  `min-h-10 max-w-full cursor-pointer truncate rounded-full border px-3 text-sm font-semibold transition-colors ${on ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface"}`;

export function StudioTextSheet({
  open,
  onClose,
  disabled,
  designId,
  scene,
  source,
  catalogHref,
  onApply,
  onMessage,
}: StudioTextSheetProps) {
  const copy = useStudioCopyIdeas(designId);
  const form = useSchemaForm<{ phrase: string; tagline: string }>(
    studioTextFields,
    async (values) => {
      onApply(
        setStudioTagline(
          setStudioPhrase(scene, source, values.phrase),
          values.tagline,
        ),
      );
      if (copy.ideas?.message) onMessage(copy.ideas.message);
      onClose();
    },
  );
  const { reset } = form,
    latest = useRef(scene);
  latest.current = scene;
  useEffect(() => {
    if (open)
      reset({
        phrase: studioPhrase(latest.current),
        tagline: studioTagline(latest.current),
      });
  }, [open, reset]);
  const phrase = form.watch("phrase"),
    tagline = form.watch("tagline"),
    phrases = copy.ideas?.phrases ?? [],
    notes = copy.ideas?.notes.length ? copy.ideas.notes : [...STUDIO_NOTES];
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Textos"
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
        <div className="space-y-2">
          <FormInput
            label="Frase grande"
            disabled={disabled}
            maxLength={80}
            {...form.register("phrase")}
            error={form.errors.phrase?.message}
          />
          {phrases.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {phrases.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={phrase === p}
                  onClick={() =>
                    form.setValue("phrase", p, { shouldValidate: true })
                  }
                  className={chip(phrase === p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            disabled={disabled || copy.busy}
            onClick={() => void copy.suggest()}
            className={`${adminActionButtonAi} w-full`}
          >
            {copy.busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {copy.busy ? "Pensando…" : "Sugerir"}
          </button>
          <p className="text-xs text-muted-foreground">
            Sugerir escribe frases para este producto. Es gratis.
          </p>
          {copy.error && <Notification tone="error" message={copy.error} />}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Frase final
          </p>
          <div className="flex flex-wrap gap-2">
            {notes.map((note) => (
              <button
                key={note}
                type="button"
                aria-pressed={tagline === note}
                onClick={() =>
                  form.setValue("tagline", tagline === note ? "" : note, {
                    shouldValidate: true,
                  })
                }
                className={chip(tagline === note)}
              >
                {note}
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
        </div>
        {(source.priceLabel || source.badge) && (
          <div className="space-y-1 rounded-xl bg-border-soft/60 p-3 text-sm">
            <p className="font-bold">{source.badge || source.priceLabel}</p>
            <p className="text-xs leading-5 text-muted-foreground">
              El precio viene de tu catálogo; si cambia allá, cambia aquí.
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
        {form.submitError && (
          <Notification tone="error" message={form.submitError} />
        )}
      </form>
    </FormSheet>
  );
}
