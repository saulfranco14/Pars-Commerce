export type DeviceKind = "kiosk";
export type DeviceStatus = "pending" | "approved" | "rejected";

/** Lo que ve el panel. Nunca incluye el token ni su hash. */
export interface TenantDevice {
  id: string;
  tenant_id: string;
  install_id: string;
  enroll_code: string;
  status: DeviceStatus;
  name: string | null;
  kind: DeviceKind;
  user_agent: string | null;
  screen_info: string | null;
  requested_at: string;
  approved_at: string | null;
  claimed_at: string | null;
  last_seen_at: string | null;
  created_at: string;
}

/** Lo que la pantalla manda al anunciarse. */
export interface EnrollDeviceInput {
  tenantSlug: string;
  installId: string;
  /** Clave de la dirección del kiosco. Sin ella no se puede ni solicitar. */
  enrollKey: string;
  userAgent?: string | null;
  screenInfo?: string | null;
}

export interface EnrollDeviceResult {
  /** Se muestra grande en la pantalla para que el dueño lo compare. */
  enrollCode: string;
  status: DeviceStatus;
  tenantName: string;
}

/** Resultado de que la pantalla pregunte si ya la aprobaron. */
export type ClaimResult =
  | { state: "pending"; enrollCode: string }
  | { state: "rejected" }
  | {
      state: "ready";
      /** Presente solo la primera vez: se acuña al reclamarlo. */
      token: string | null;
      deviceId: string;
      deviceName: string | null;
      tenantId: string;
      tenantSlug: string;
      tenantName: string;
    };

/** Dispositivo autenticado, tal como lo ve un endpoint de kiosco. */
export interface AuthenticatedDevice {
  deviceId: string;
  tenantId: string;
  name: string | null;
  kind: DeviceKind;
}
