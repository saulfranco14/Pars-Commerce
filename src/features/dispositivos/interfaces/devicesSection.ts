import type { TenantDevice } from "@/features/dispositivos/interfaces/device";

export interface ConfigDispositivosSectionProps {
  tenantId: string;
  /** `false` oculta todo: aprobar una pantalla es cosa del dueño. */
  canManage: boolean;
}

export interface KioskUrlCardProps {
  tenantId: string;
}

export interface PendingDeviceCardProps {
  device: TenantDevice;
  onApprove: (device: TenantDevice) => void;
  onReject: (device: TenantDevice) => void;
  busy: boolean;
}

export interface DeviceRowProps {
  device: TenantDevice;
  onRevoke: (device: TenantDevice) => void;
  onDelete: (device: TenantDevice) => void;
  onRename: (device: TenantDevice, name: string) => void;
  busy: boolean;
}
