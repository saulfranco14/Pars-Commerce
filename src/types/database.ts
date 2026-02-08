export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role_type: number | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  business_type: string | null;
  logo_url: string | null;
  banner_url: string | null;
  theme_color: string | null;
  description: string | null;
  public_store_enabled: boolean;
  settings: Json | null;
  created_at: string;
  updated_at: string;
}

export interface TenantRole {
  id: string;
  tenant_id: string;
  name: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantMembership {
  id: string;
  user_id: string;
  tenant_id: string;
  role_id: string;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantMembershipWithTenantAndRole extends TenantMembership {
  tenant: Tenant;
  role: TenantRole;
}

export type OrderStatus =
  | "draft"
  | "assigned"
  | "in_progress"
  | "completed"
  | "pending_payment"
  | "paid"
  | "cancelled";
