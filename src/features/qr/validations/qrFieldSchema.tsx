import { Controller } from "react-hook-form";
import { DollarSign, Tag, Users } from "lucide-react";

import { QrKindSelector } from "@/features/qr/components/QrKindSelector";

import type { FieldSchema } from "@/lib/forms/fieldSchema";

interface BuildQrFieldsOptions {
  /** When true, hides the kind picker entirely — used from Mesas, which only ever creates "table" QRs. */
  lockKind?: boolean;
  /** Initial value for `kind` — also the fixed value used when `lockKind` hides the picker. */
  defaultKind?: "payment" | "table";
}

/**
 * Declarative registration fields for "Nuevo QR" (also reused by "Agregar
 * mesa" via lockKind). `kind` drives conditional required/visible rules on
 * `table_capacity` and `preset_amount` — same Yup `.when("kind", ...)` logic
 * as the former qrCodeSchema, now expressed via `showWhen`/`requiredWhen`.
 * `kind` itself is a `type: "custom"` field so the radio-card QrKindSelector
 * keeps its exact UI instead of becoming a plain `<select>`. When `lockKind`
 * is set, `kind` is still declared (as a hidden field defaulting to
 * `defaultKind`) so the conditional rules on the other fields keep working —
 * it just isn't rendered as a visible picker.
 */
export function buildQrFields({
  lockKind = false,
  defaultKind = "payment",
}: BuildQrFieldsOptions = {}): FieldSchema[] {
  const fields: FieldSchema[] = [
    {
      name: "kind",
      label: "Tipo de QR",
      type: "custom",
      required: true,
      defaultValue: defaultKind,
      showWhen: () => !lockKind,
      render: ({ control, disabled }) => (
        <Controller
          name="kind"
          control={control}
          render={({ field }) => (
            <QrKindSelector
              value={field.value as "payment" | "table"}
              onChange={field.onChange}
              disabled={disabled}
            />
          )}
        />
      ),
    },
  ];

  fields.push(
    {
      name: "label",
      label: lockKind ? "Nombre de la mesa" : "Etiqueta",
      type: "text",
      icon: Tag,
      placeholder: lockKind
        ? "Ej. Mesa 5, Terraza A"
        : "Ej. Mesa 5, Caja principal, Propinas",
      required: true,
    },
    {
      name: "table_capacity",
      label: "Capacidad",
      type: "number",
      icon: Users,
      hint: "Número de personas",
      placeholder: "4",
      required: false,
      showWhen: (values) => values.kind === "table",
      requiredWhen: (values) => values.kind === "table",
      yupNumber: (base) => base.min(1, "La capacidad debe ser al menos 1"),
    },
    {
      name: "preset_amount",
      label: "Monto sugerido",
      type: "number",
      icon: DollarSign,
      hint: "Déjalo vacío para que el cliente decida",
      placeholder: "0.00",
      required: false,
      showWhen: (values) => values.kind === "payment",
      yupNumber: (base) => base.min(0, "El monto no puede ser negativo"),
    },
  );

  return fields;
}

export interface QrFieldValues {
  kind: "payment" | "table";
  label: string;
  table_capacity?: number;
  preset_amount?: number;
}
