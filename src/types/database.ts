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

export interface TenantAddress {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone?: string | null;
}

export interface TenantSalesConfig {
  monthly_rent: number;
  monthly_sales_objective: number;
}

export interface TenantSocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
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
  whatsapp_phone?: string | null;
  social_links?: TenantSocialLinks | null;
  address?: TenantAddress | null;
  sales_config?: TenantSalesConfig | null;
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
