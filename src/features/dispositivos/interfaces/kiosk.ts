import type { RequestedItem } from "@/features/qr/helpers/buildOrderItemRows";
import type { BusinessHours } from "@/features/configuracion/interfaces/businessHours";
import type { PickupSchedulingConfig } from "@/features/checkout/interfaces/pickupSchedule";
import type { MenuItem } from "@/features/qr/interfaces/tableCart";

/**
 * Una categoría del catálogo con una foto representativa: la rejilla de
 * categorías de la pantalla se ve con imagen, no con texto pelón.
 */
export interface KioskCategory {
  id: string;
  name: string;
  imageUrl: string | null;
}

/** Todo lo que la pantalla necesita para armar un pedido, en una sola llamada. */
export interface KioskCatalog {
  tenantName: string;
  tenantLogoUrl: string | null;
  deviceName: string | null;
  acceptingOrders: boolean;
  products: MenuItem[];
  categories: KioskCategory[];
  pickupScheduling: PickupSchedulingConfig;
  businessHours: BusinessHours | null;
  /** Segundos sin toques antes de que la pantalla se reinicie. */
  idleResetSeconds: number;
}

export interface CreateKioskOrderInput {
  deviceId: string;
  tenantId: string;
  items: RequestedItem[];
  customerName?: string | null;
  /** ISO de la hora de recolección, o `null` para "cuando esté listo". */
  scheduledFor?: string | null;
}

export interface CreateKioskOrderResult {
  orderId: string;
  /** Token del QR de un solo uso que el cliente escanea para pagar. */
  qrToken: string;
  total: number;
  /** Los 8 primeros del id, para que el mostrador lo cante. */
  orderNumber: string;
}
