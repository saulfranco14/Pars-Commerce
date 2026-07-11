/**
 * Shape of the `/api/qr/resolve` response when the QR is of kind "table".
 * Lives outside the components so the service, hook, and any consumer share
 * the same contract.
 */

export interface QrSessionTenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
}

export interface QrSessionQrCode {
  id: string;
  label: string;
  token: string;
}

export interface QrSessionOrder {
  id: string;
  status: string;
  fulfillment_status?: string;
  /** This caller's OWN preparation state (per-person); drives "ya puedes pagar". */
  my_fulfillment_status?: string;
  subtotal?: number;
  total?: number;
  paid_total?: number;
  balance_due?: number;
  /** Live line-item count from the pulse; drives new-batch detection. */
  item_count?: number;
}

export interface QrSessionMenuItem {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  subcatalog_id?: string | null;
  description?: string | null;
}

/** A product category (subcatalog) used to group the menu. */
export interface QrSessionCategory {
  id: string;
  name: string;
}

export interface QrSessionDevice {
  id: string;
  display_name: string | null;
  color_hex?: string;
  is_owner?: boolean;
}

export interface QrIncomingMergeRequest {
  id: string;
  requester_label: string;
  expires_at: string;
}

export interface QrOutgoingMergeRequest {
  id: string;
  target_label: string;
  expires_at: string;
}

export interface TableSessionResponse {
  tenant: QrSessionTenant;
  qr_code: QrSessionQrCode;
  order?: QrSessionOrder | null;
  menu?: QrSessionMenuItem[];
  categories?: QrSessionCategory[];
  my_device?: QrSessionDevice | null;
  is_new_session?: boolean;
  connected_devices?: number;
  incoming_merge_request?: QrIncomingMergeRequest | null;
  outgoing_merge_request?: QrOutgoingMergeRequest | null;
}

/**
 * Shape of `/api/qr/table/pulse` — the read-only heartbeat the mesa screen
 * polls instead of the heavy `/api/qr/resolve` (which loads the whole menu
 * and creates orders/devices as side effects).
 */
export interface TablePulseResponse {
  active: boolean;
  order?: {
    id: string;
    status: string;
    fulfillment_status?: string;
    /** This caller's OWN preparation state (per-person). */
    my_fulfillment_status?: string;
    /** Running total, so the mesa screen shows amount changes without a resolve. */
    total?: number;
    /** Line-item count; a change means a new batch landed → refresh the tracker. */
    item_count?: number;
  } | null;
  connected_devices?: number;
  i_am_owner?: boolean;
  incoming_merge_request?: QrIncomingMergeRequest | null;
  outgoing_merge_request?: QrOutgoingMergeRequest | null;
}
