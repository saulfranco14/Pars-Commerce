import type { KioskCartLine } from "@/features/dispositivos/hooks/useKioskCart";
import type { KioskCategory } from "@/features/dispositivos/interfaces/kiosk";
import type { BusinessHours } from "@/features/configuracion/interfaces/businessHours";
import type { PickupSchedulingConfig } from "@/features/checkout/interfaces/pickupSchedule";
import type { MenuItem } from "@/features/qr/interfaces/tableCart";

export interface KioskTicketScreenProps {
  orderNumber: string;
  qrToken: string;
  total: number;
  /** ISO de la hora de recolección, si el cliente agendó. */
  scheduledFor: string | null;
  onDone: () => void;
}

export interface KioskAttractScreenProps {
  tenantName: string;
  tenantLogoUrl: string | null;
  /** Fotos que desfilan de fondo. Sin fotos cae a un fondo de marca. */
  products: MenuItem[];
  onStart: () => void;
}

export interface KioskCategoryRailProps {
  categories: KioskCategory[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Cuántos productos tiene cada categoría, por id. `all` trae el total. */
  counts: Record<string, number>;
  tenantLogoUrl: string | null;
  tenantName: string;
}

export interface KioskProductTileProps {
  product: MenuItem;
  quantity: number;
  onOpen: (product: MenuItem) => void;
  onAdd: (productId: string) => void;
}

export interface KioskProductDialogProps {
  product: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  /** Cuántas lleva ya en el pedido. */
  inCartQuantity: number;
  onAdd: (productId: string, qty: number) => void;
  tenantLogoUrl: string | null;
}

export interface KioskCartPanelProps {
  lines: KioskCartLine[];
  total: number;
  itemCount: number;
  onAdd: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onConfirm: () => void;
  submitting: boolean;
  error: string | null;
  pickupScheduling: PickupSchedulingConfig;
  businessHours: BusinessHours | null;
  scheduledFor: string;
  onScheduleChange: (value: string) => void;
}
