import type { BusinessHours } from "@/features/configuracion/interfaces/businessHours";

export interface BusinessHoursNoticeProps {
  /** `null` = sin dar de alta. */
  hours: BusinessHours | null;
  /** Sin agendar activo, los horarios no cambian nada y el aviso sobra. */
  schedulingEnabled: boolean;
  tenantSlug: string;
}
