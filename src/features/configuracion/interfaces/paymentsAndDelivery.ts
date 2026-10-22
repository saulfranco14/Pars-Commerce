import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import type { BusinessHours, Weekday } from "@/features/configuracion/interfaces/businessHours";

export interface PickupPointDraft {
  id?: string;
  name?: string | null;
  address_text?: string | null;
  reference?: string | null;
  instructions?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapbox_feature_id?: string | null;
  /** `null` means the point inherits the business schedule. */
  business_hours?: BusinessHours | null;
}

export type PickupPointTab = "location" | "hours";

export interface StorePaymentMethod {
  id: string;
  kind: "bank_transfer" | "cash";
  label: string | null;
  bank_name: string | null;
  account_holder: string | null;
  clabe: string | null;
  account_number: string | null;
  is_active: boolean;
}

export interface FulfillmentSettings {
  online_payment_enabled?: boolean;
  delivery_enabled: boolean;
  delivery_fee: number | string;
  delivery_area_label: string | null;
  pickup_enabled: boolean;
}

/** What `/api/tenant-fulfillment` returns: how the business charges and hands orders over. */
export interface PaymentsAndDeliverySnapshot {
  settings: FulfillmentSettings | null;
  pickupPoints: PickupPointDraft[];
  paymentMethods: StorePaymentMethod[];
  onlinePaymentConnected: boolean;
  businessHours: BusinessHours | null;
}

export interface TransferDraft {
  id?: string;
  enabled: boolean;
  label: string;
  bank_name: string;
  account_holder: string;
  clabe: string;
  account_number: string;
}

export interface PaymentsAndDeliveryForm {
  online_payment_enabled: boolean;
  delivery_enabled: boolean;
  delivery_fee: string;
  delivery_area_label: string;
  pickup_enabled: boolean;
  pickup_points: PickupPointDraft[];
  transfer: TransferDraft;
  cash_enabled: boolean;
}

export interface PaymentsAndDeliveryPanelProps {
  tenantId: string;
  tenantSlug: string;
  /** Only the owner connects or disconnects Mercado Pago. */
  canManagePayments: boolean;
  /** `?payment_provider=` after coming back from Mercado Pago. */
  providerResult: string | null;
}

export interface SettingToggleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled?: boolean;
  disabled?: boolean;
  onToggle?: (checked: boolean) => void;
  children?: ReactNode;
}

export interface SettingFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
}

export interface DeliveryAreaFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export interface PickupPointFormProps {
  value: PickupPointDraft;
  globalHours: BusinessHours | null;
  tab: PickupPointTab;
  onTabChange: (tab: PickupPointTab) => void;
  onChange: (value: PickupPointDraft) => void;
}

export interface PickupTabButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export interface PickupAddressSearchProps {
  value: PickupPointDraft;
  onChange: (value: PickupPointDraft) => void;
}

export interface PickupHoursEditorProps {
  value: BusinessHours | null;
  globalHours: BusinessHours | null;
  onChange: (value: BusinessHours | null) => void;
}

export interface PickupDayEditorProps {
  weekday: Weekday;
  hours: BusinessHours;
  onChange: (hours: BusinessHours) => void;
}

export interface TimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export interface PickupPointCardProps {
  point: PickupPointDraft;
  isMain: boolean;
  globalHours: BusinessHours | null;
  onEdit: () => void;
  onRemove: () => void;
}
