"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { STUDIO_QUALITIES, STUDIO_SCENES } from "../../constants/studio";
import type { StudioGenerateSheetProps } from "../../interfaces/ui";
import type { StudioImageRequest } from "../../interfaces/studio";

const chip = (on: boolean) =>
  `min-h-10 cursor-pointer rounded-full border px-3 text-sm font-semibold transition-colors ${on ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface"}`;

export function StudioGenerateSheet({
  open,
  onClose,
  disabled,
  balance,
  rechargeHref,
  onGenerate,
}: StudioGenerateSheetProps) {
  const [scene, setScene] = useState<StudioImageRequest["scene"]>("local"),
    [quality, setQuality] = useState<StudioImageRequest["quality"]>("economy"),
    [wish, setWish] = useState("");
  const cost = STUDIO_QUALITIES.find((q) => q.value === quality)?.cost ?? 1,
    enough = balance >= cost;
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Imagen para tu anuncio"
      description="Ponemos tu producto en una escena de tu negocio, con luz profesional. Tu producto se respeta: misma forma y color."
      icon={Sparkles}
      footer={
        <div className={actionPair}>
          <button
            type="button"
            className={adminActionButtonSecondary}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            type="button"
            className={adminActionButtonPrimary}
            disabled={disabled || !enough}
            onClick={() => onGenerate({ scene, quality, wish })}
          >
            <Sparkles className="h-4 w-4" />
            Generar
          </button>
        </div>
      }
    >
      <div className="space-y-5 pb-3">
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Escena
          </legend>
          <div className="flex flex-wrap gap-2">
            {STUDIO_SCENES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={scene === s.id}
                onClick={() => setScene(s.id)}
                className={chip(scene === s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>
        <FormInput
          label="¿Algo en especial? (opcional)"
          placeholder="Ej. de noche, sobre una mesa de madera"
          maxLength={160}
          value={wish}
          onChange={(e) => setWish(e.target.value)}
        />
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Calidad
          </legend>
          <div className="flex flex-wrap gap-2">
            {STUDIO_QUALITIES.map((q) => (
              <button
                key={q.value}
                type="button"
                aria-pressed={quality === q.value}
                onClick={() => setQuality(q.value)}
                className={chip(quality === q.value)}
              >
                {q.label} · {q.cost} {q.cost === 1 ? "Tlaco" : "Tlacos"}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="flex flex-wrap justify-between gap-2 rounded-xl bg-border-soft/60 p-3 text-sm text-muted-foreground">
          <span>
            Cuesta{" "}
            <b className="text-foreground">
              {cost} {cost === 1 ? "Tlaco" : "Tlacos"}
            </b>
            . Te quedan {balance}.
          </span>
          {enough ? (
            <span>Se guarda en tus imágenes</span>
          ) : (
            <Link
              href={rechargeHref}
              className="font-semibold text-accent underline"
            >
              Recargar
            </Link>
          )}
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          El tiempo de generación puede variar. Si la imagen no se genera, no te
          cobramos.
        </p>
      </div>
    </FormSheet>
  );
}
