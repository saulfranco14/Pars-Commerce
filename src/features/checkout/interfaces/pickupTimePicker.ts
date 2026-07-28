import type { PickupSchedulingConfig } from "@/features/checkout/interfaces/pickupSchedule";
import type { BusinessHours } from "@/features/configuracion/interfaces/businessHours";

export interface PickupTimePickerProps {
  config: PickupSchedulingConfig;
  /** `null` = sin horarios dados de alta; no se restringe por hora. */
  businessHours: BusinessHours | null;
  /** Hora elegida en ISO, o `""` si el cliente pasa cuando esté listo. */
  value: string;
  onChange: (isoValue: string) => void;
  /** Color de marca del negocio, para el chip activo. */
  accentColor: string;
  disabled?: boolean;
  error?: string;
}
