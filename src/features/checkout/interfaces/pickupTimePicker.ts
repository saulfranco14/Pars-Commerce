import type { PickupSchedulingConfig } from "@/features/checkout/interfaces/pickupSchedule";

export interface PickupTimePickerProps {
  config: PickupSchedulingConfig;
  /** Hora elegida en ISO, o `""` si el cliente pasa cuando esté listo. */
  value: string;
  onChange: (isoValue: string) => void;
  /** Color de marca del negocio, para el chip activo. */
  accentColor: string;
  disabled?: boolean;
  error?: string;
}
