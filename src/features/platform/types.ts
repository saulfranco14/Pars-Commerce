export type PlatformAccountStatus = "active" | "pending" | "suspended";

export type PlatformUser = {
  id: string;
  email: string;
  display_name: string;
  phone: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  created_at: string | null;
  banned_until: string | null;
  status: PlatformAccountStatus;
  is_self: boolean;
  is_platform_admin: boolean;
  businesses: number;
  active_businesses: number;
  memberships: Array<{
    tenant_id: string;
    status: string;
    tenant: { name: string; slug: string } | null;
    role: string;
  }>;
};

export type PlatformUsersResponse = {
  users: PlatformUser[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  stats: { total: number; active: number; pending: number; suspended: number };
};

export type PlatformTenant = {
  id: string;
  name: string;
  slug: string;
  business_type: string | null;
  description: string | null;
  logo_url: string | null;
  public_store_enabled: boolean;
  accepting_orders: boolean;
  whatsapp_phone: string | null;
  created_at: string;
  updated_at: string;
  owner: { display_name: string | null; email: string | null; phone: string | null } | null;
  address: { city: string | null; state: string | null; country: string | null; phone: string | null } | null;
  billing: { plan_code: string; status: string; current_period_end: string | null };
  team_active: number;
  team_invited: number;
  active_tables: number;
  tables_enabled: number;
  orders_30d: number;
  sales_30d: number;
  open_orders: number;
  last_order_at: string | null;
  can_open_dashboard: boolean;
};

export type PlatformTenantsResponse = {
  tenants: PlatformTenant[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  stats: { total: number; accepting_orders: number; paused: number; store_off: number };
};
