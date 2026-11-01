export type DropReason = "rechazo" | "cerrado" | "no_abrio" | "otro";

export interface ColdLead {
  id: string;
  business_name: string;
  giro: string;
  municipio: string;
  colonia: string | null;
  whatsapp_attempts: number;
  last_whatsapp_at: string;
  owner_user_id: string | null;
  owner_name: string | null;
}

export interface ColdLeadsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Coordinators looking at the team see everyone's; otherwise only one's own. */
  owner?: string;
}

export interface DropLeadSheetProps {
  isOpen: boolean;
  businessName: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: DropReason) => Promise<unknown>;
}
