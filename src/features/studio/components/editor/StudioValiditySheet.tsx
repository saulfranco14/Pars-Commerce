"use client";
import { useState } from "react";
import { CalendarClock, Check, X } from "lucide-react";
import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import type { StudioValiditySheetProps } from "../../interfaces/ui";

const DAY_MS = 86_400_000;
/** Dates in the business's own calendar, so «hoy» means today in Mexico. */
const day = (offset: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(
    new Date(Date.now() + offset * DAY_MS),
  );

/** Changes the promotion's end date right here, without leaving the ad. */
export function StudioValiditySheet({
  open,
  onClose,
  disabled,
  saving,
  onSave,
}: StudioValiditySheetProps) {
  const [value, setValue] = useState(() => day(7));
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Hasta cuándo"
      description="La promoción vuelve a estar activa en tu tienda hasta ese día."
      icon={CalendarClock}
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
            disabled={disabled || saving || !value || value < day(0)}
            onClick={() => void onSave(value).then((ok) => ok && onClose())}
          >
            <Check className="h-4 w-4" />
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      }
    >
      <div className="pb-3">
        <FormInput
          label="Último día"
          type="date"
          min={day(0)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </FormSheet>
  );
}
