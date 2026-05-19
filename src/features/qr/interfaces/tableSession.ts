/**
 * Shape of the `/api/qr/resolve` response when the QR is of kind "table".
 * Lives outside the components so the service, hook, and any consumer share
 * the same contract.
 */

export interface QrSessionTenant {
  id: string;
  name: string;
  slug: string;
}

export interface QrSessionQrCode {
  id: string;
  label: string;
  token: string;
}

export interface QrSessionOrder {
  id: string;
  status: string;
}

export interface QrSessionMenuItem {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
}

export interface QrSessionDevice {
  id: string;
  display_name: string | null;
  color_hex?: string;
}

export interface TableSessionResponse {
  tenant: QrSessionTenant;
  qr_code: QrSessionQrCode;
  order?: QrSessionOrder | null;
  menu?: QrSessionMenuItem[];
  my_device?: QrSessionDevice | null;
  is_new_session?: boolean;
  connected_devices?: number;
}
