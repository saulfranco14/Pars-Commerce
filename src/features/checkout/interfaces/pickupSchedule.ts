/**
 * Ventana en la que el cliente puede agendar su recolección.
 *
 * Vive en `tenants.settings.pickup_scheduling` (jsonb), igual que
 * `recurring_purchases`, para no sumar tres columnas a `tenants` por una
 * preferencia que cabe en un objeto.
 */
export interface PickupSchedulingConfig {
  /** Si el sitio ofrece agendar. Con `false` el pedido se recoge "cuando esté". */
  enabled: boolean;
  /**
   * Cuánto tiempo mínimo necesita el negocio para tenerlo listo. Evita que
   * alguien agende "en 5 minutos" y llegue a un pedido que nadie empezó.
   */
  minLeadMinutes: number;
  /** Hasta cuántos días adelante se puede agendar. */
  maxDaysAhead: number;
}

export const DEFAULT_PICKUP_SCHEDULING: PickupSchedulingConfig = {
  enabled: false,
  minLeadMinutes: 30,
  maxDaysAhead: 7,
};
