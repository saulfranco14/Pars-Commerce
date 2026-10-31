export type ActivationStage = "registrado" | "tienda_lista" | "cobros" | "primera_venta" | "activo";

export interface ActivationLead {
  lead_id: string;
  business_name: string;
  giro: string;
  municipio: string;
  owner_user_id: string | null;
  owner_name?: string | null;
  tenant_id: string | null;
  tenant_slug: string | null;
  registered_at: string | null;
  activation: ActivationStage;
  paid_orders_30d: number;
}

export interface ActivationColumn {
  stage: ActivationStage;
  leads: ActivationLead[];
}

export interface ActivationViewProps {
  owner?: string;
  showOwner: boolean;
}
