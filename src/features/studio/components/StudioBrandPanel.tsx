"use client";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { Palette, Save } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Notification } from "@/components/ui/Notification";
import { FormInput } from "@/components/ui/FormInput";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";
import { loadBrand, saveBrand } from "../services/studioClientService";
import { useStudioContext } from "./StudioProvider";
import { StudioLoading } from "./StudioLoading";
import { STUDIO_FONTS, STUDIO_FORMATS } from "../constants/studio";
import { StudioOptions } from "./StudioOptions";
import type { FieldSchema } from "@/lib/forms/fieldSchema";
import type { StudioBrand } from "../interfaces/studio";

const fields: FieldSchema[] = [
  {
    name: "primary",
    label: "Color principal",
    type: "text",
    required: true,
    yupString: (base) =>
      base.matches(/^#[0-9a-fA-F]{6}$/, "Usa un color como #3483fa."),
  },
  {
    name: "secondary",
    label: "Color secundario",
    type: "text",
    required: true,
    yupString: (base) =>
      base.matches(/^#[0-9a-fA-F]{6}$/, "Usa un color de seis dígitos."),
  },
  { name: "font", label: "Tipografía", type: "text", defaultValue: "Arial" },
  { name: "format", label: "Formato", type: "text", defaultValue: "square" },
];
function BrandForm({
  brand,
  onSaved,
}: {
  brand: StudioBrand;
  onSaved: (brand: StudioBrand) => void;
}) {
  const { tenantId, summary } = useStudioContext(),
    [saved, setSaved] = useState(false);
  const configured = useMemo(
    () =>
      fields.map((f) => ({
        ...f,
        defaultValue:
          f.name === "primary"
            ? brand.colors[0]
            : f.name === "secondary"
              ? (brand.colors[1] ?? "#172033")
              : f.name === "font"
                ? brand.font
                : brand.default_format,
      })),
    [brand],
  );
  const form = useSchemaForm<{
    primary: string;
    secondary: string;
    font: StudioBrand["font"];
    format: StudioBrand["default_format"];
  }>(configured, async (values) => {
    const savedBrand: StudioBrand = {
      colors: [values.primary, values.secondary],
      font: values.font,
      default_format: values.format,
    };
    await saveBrand(tenantId, savedBrand);
    onSaved(savedBrand);
    form.reset(values);
    setSaved(true);
  });
  const canEdit =
    summary?.active && summary.permissions.includes("studio.manage");
  return (
    <form
      onSubmit={form.handleSubmit(form.submit)}
      className="max-w-xl space-y-5 rounded-2xl border border-border bg-surface p-5"
    >
      {saved && (
        <Notification
          tone="success"
          message="Preferencias de marca guardadas."
        />
      )}
      <div className="flex items-center gap-3">
        <Palette className="h-6 w-6 text-accent" />
        <p className="text-sm text-muted-foreground">
          Estas preferencias se aplican a nuevos diseños. Tu logo y catálogo
          originales se conservan.
        </p>
      </div>
      {form.submitError && (
        <Notification tone="error" message={form.submitError} />
      )}
      <FormInput
        label="Color principal"
        defaultValue={brand.colors[0]}
        {...form.register("primary")}
        error={form.errors.primary?.message}
        disabled={!canEdit}
      />
      <FormInput
        label="Color secundario"
        defaultValue={brand.colors[1] ?? "#172033"}
        {...form.register("secondary")}
        error={form.errors.secondary?.message}
        disabled={!canEdit}
      />
      <StudioOptions
        label="Tipografía"
        value={form.watch("font") || brand.font}
        options={STUDIO_FONTS.map((font) => ({ value: font, label: font }))}
        onChange={(v) => form.setValue("font", v)}
        disabled={!canEdit}
      />
      <StudioOptions
        label="Formato inicial"
        value={form.watch("format") || brand.default_format}
        options={Object.entries(STUDIO_FORMATS).map(([value, format]) => ({
          value: value as StudioBrand["default_format"],
          label: format.label,
        }))}
        onChange={(v) => form.setValue("format", v)}
        disabled={!canEdit}
      />
      <button
        className={adminActionButtonPrimary}
        disabled={!canEdit || form.submitting}
      >
        <Save className="h-4 w-4" />
        {form.submitting ? "Guardando…" : "Guardar marca"}
      </button>
    </form>
  );
}
export function StudioBrandPanel() {
  const { tenantId } = useStudioContext(),
    { data, isLoading, error, mutate } = useSWR(
      ["studio-brand", tenantId],
      () => loadBrand(tenantId),
    );
  return (
    <div className="space-y-5">
      <PageHeader
        title="Tu marca en Studio"
        description="Colores, tipografía y formato para comenzar con coherencia."
      />
      {isLoading ? (
        <StudioLoading />
      ) : error ? (
        <Notification tone="error" message="No pudimos cargar tu marca." />
      ) : data ? (
        <BrandForm
          brand={data}
          onSaved={(brand) => {
            void mutate(brand, false);
          }}
        />
      ) : null}
    </div>
  );
}
