"use client";

import { RefreshCcw, Tag, Type } from "lucide-react";

import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { FormInput } from "@/components/ui/FormInput";
import { ImageUpload } from "@/components/ImageUpload";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";
import { CHOICE_CHIP, FIELD_LABEL } from "@/components/wizard/wizardStyles";
import { PromotionPreviewStrip } from "@/features/promociones/components/wizard/PromotionPreviewStrip";

import { NXM_PRESETS, PERCENTAGE_PRESETS } from "@/features/promociones/constants/promotionMechanics";
import { OFFER_WIZARD_TITLE_ID } from "@/features/promociones/constants/offerWizard";
import { VALIDITY_OPTIONS, validityRange } from "@/features/promociones/helpers/validityPresets";

import type { ValidityPreset } from "@/features/promociones/interfaces/offerTemplate";
import type { OfferWizardValues, PickerItem } from "@/features/promociones/interfaces/offerWizard";
import type { Path, PathValue, UseFormReturn } from "react-hook-form";

const CHIP = CHOICE_CHIP.base;
const CHIP_ON = CHOICE_CHIP.on;
const CHIP_OFF = CHOICE_CHIP.off;
const LABEL = FIELD_LABEL;

export function DetailsStep({
  form,
  values,
  tenantId,
  itemsById,
  onSuggestName,
}: {
  form: UseFormReturn<OfferWizardValues>;
  values: OfferWizardValues;
  tenantId: string;
  itemsById: Map<string, PickerItem>;
  onSuggestName: () => void;
}) {
  const { errors } = form.formState;
  const set = <K extends Path<OfferWizardValues>>(key: K, value: PathValue<OfferWizardValues, K>) =>
    form.setValue(key, value, { shouldValidate: true, shouldDirty: true });
  const mechanic = values.mechanic;

  function chooseValidity(preset: ValidityPreset) {
    set("validity", preset);
    if (preset !== "custom") {
      const range = validityRange(preset);
      set("validFrom", range.from);
      set("validUntil", range.until);
    }
  }

  const packListTotal = values.packItems.reduce((sum, item) => sum + (itemsById.get(item.product_id)?.price ?? 0) * item.quantity, 0);

  return (
    <div className="space-y-6">
      <WizardStepHeading
        titleId={OFFER_WIZARD_TITLE_ID}
        eyebrow="Detalles"
        title="Ajusta el precio y la vigencia"
        subtitle="Así se verá y cobrará en tu tienda."
      />

      {mechanic === "percentage" ? (
        <fieldset>
          <legend className={LABEL}>Descuento</legend>
          <div className="flex flex-wrap items-center gap-2">
            {PERCENTAGE_PRESETS.map((preset) => (
              <button key={preset} type="button" onClick={() => set("value", String(preset))} className={`${CHIP} ${values.value === String(preset) ? CHIP_ON : CHIP_OFF}`}>
                {preset}%
              </button>
            ))}
            <label className="flex min-h-11 w-28 items-center rounded-full border border-border bg-surface px-3 focus-within:border-accent">
              <span className="sr-only">Otro porcentaje</span>
              <input
                inputMode="numeric"
                value={values.value}
                onChange={(event) => set("value", event.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="Otro"
                className="w-full bg-transparent text-sm font-semibold outline-none"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </label>
          </div>
        </fieldset>
      ) : null}

      {mechanic === "fixed_amount" || mechanic === "fixed_price" || mechanic === "bundle_price" ? (
        <div>
          <span className={LABEL}>
            {mechanic === "fixed_amount" ? "Cuánto se descuenta por pieza" : mechanic === "fixed_price" ? "Precio especial" : "Precio del paquete"}
          </span>
          <CurrencyInput value={values.value} onValueChange={(value) => set("value", value)} placeholder="0.00" aria-label="Monto" />
          {mechanic === "bundle_price" && packListTotal > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              Por separado suman ${packListTotal.toFixed(2)}.
              {[0.9, 0.85, 0.8].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => set("value", (Math.floor(packListTotal * ratio)).toFixed(2))}
                  className={`${CHIP} min-h-9 px-3 text-xs ${CHIP_OFF}`}
                >
                  {Math.round((1 - ratio) * 100)}% menos
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {mechanic === "nxm" ? (
        <fieldset>
          <legend className={LABEL}>Lleva y paga</legend>
          <div className="flex flex-wrap gap-2">
            {NXM_PRESETS.map((preset) => {
              const active = values.buyQuantity === preset.buy && values.payQuantity === preset.pay;
              return (
                <button
                  key={`${preset.buy}x${preset.pay}`}
                  type="button"
                  onClick={() => {
                    set("buyQuantity", preset.buy);
                    set("payQuantity", preset.pay);
                  }}
                  className={`${CHIP} ${active ? CHIP_ON : CHIP_OFF}`}
                >
                  {preset.buy}x{preset.pay}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {mechanic === "event_badge" ? (
        <FormInput
          label="Etiqueta en la tienda"
          icon={Tag}
          value={values.badgeLabel}
          onChange={(event) => set("badgeLabel", event.target.value)}
          placeholder="Buen Fin"
          maxLength={30}
          error={errors.badgeLabel?.message}
        />
      ) : null}

      {errors.value?.message || errors.payQuantity?.message ? (
        <p className="text-sm font-medium text-red-600">{errors.value?.message ?? errors.payQuantity?.message}</p>
      ) : null}

      <PromotionPreviewStrip values={values} itemsById={itemsById} />

      <fieldset>
        <legend className={LABEL}>Vigencia</legend>
        <div className="flex flex-wrap gap-2">
          {VALIDITY_OPTIONS.filter((option) => mechanic !== "event_badge" || option.value !== "none").map((option) => (
            <button key={option.value} type="button" onClick={() => chooseValidity(option.value)} className={`${CHIP} ${values.validity === option.value ? CHIP_ON : CHIP_OFF}`}>
              {option.label}
            </button>
          ))}
        </div>
        {values.validity !== "none" ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-muted-foreground">Desde</span>
              <input
                type="date"
                value={values.validFrom}
                onChange={(event) => {
                  set("validity", "custom");
                  set("validFrom", event.target.value);
                }}
                className="min-h-11 w-full rounded-xl border border-border bg-surface px-3"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-muted-foreground">Hasta</span>
              <input
                type="date"
                value={values.validUntil}
                onChange={(event) => {
                  set("validity", "custom");
                  set("validUntil", event.target.value);
                }}
                className="min-h-11 w-full rounded-xl border border-border bg-surface px-3"
              />
            </label>
          </div>
        ) : null}
        {errors.validUntil?.message ? <p className="mt-2 text-sm font-medium text-red-600">{errors.validUntil.message}</p> : null}
      </fieldset>

      <div className="space-y-2">
        <FormInput
          label="Nombre en tu tienda"
          icon={Type}
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
          maxLength={80}
          error={errors.name?.message}
        />
        <button type="button" onClick={onSuggestName} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-accent hover:bg-accent/10">
          <RefreshCcw className="h-4 w-4" aria-hidden />
          Sugerir nombre
        </button>
      </div>

      <label className="block">
        <span className={LABEL}>
          Descripción <span className="font-normal text-muted-foreground">(opcional)</span>
        </span>
        <textarea
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Condiciones o detalles que verá el cliente"
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-base outline-none focus:border-accent"
        />
      </label>

      <ImageUpload
        tenantId={tenantId}
        variant="promotion"
        currentUrl={values.imageUrl || null}
        onUploaded={(url) => set("imageUrl", url)}
        label="Imagen de la promoción (opcional)"
      />
    </div>
  );
}
