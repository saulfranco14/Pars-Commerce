import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { Database, Json } from "@/types/database.types";
import { getAdditionalBusinessAccess } from "@/features/billing/businessExpansion";
import type { RegistrationIntent } from "@/features/auth/registrationIntent";
import { ensureCatalogTemplates } from "@/features/catalog/catalogBootstrap";
import { normalizeMexicanPhone } from "@/lib/phone";

type TenantUpdate = Database["public"]["Tables"]["tenants"]["Update"];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // An invitation becomes usable only after the invited person has a verified
  // Supabase session. This keeps email verification as the acceptance proof
  // without creating a second token system.
  if (user.email_confirmed_at) {
    const admin = createAdminClient();
    await admin
      .from("tenant_memberships")
      .update({ status: "active", accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() } as never)
      .eq("user_id", user.id)
      .eq("status", "invited")
      .or(`invitation_expires_at.is.null,invitation_expires_at.gt.${new Date().toISOString()}`);
    // Assisted onboarding uses the same membership acceptance proof.  Once the
    // owner has a verified session, its checklist advances to payment setup;
    // it never activates live sales by itself.
    await admin
      .from("assisted_onboardings" as never)
      .update({ status: "payments_pending", invitation_accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() } as never)
      .eq("owner_user_id", user.id)
      .eq("status", "invited");
  }

  const { data: memberships, error } = await supabase
    .from("tenant_memberships")
    .select(
      `
      id,
      tenant_id,
      role_id,
      accepted_at,
      tenant:tenants(id, name, slug, business_type, logo_url, theme_color, description, public_store_enabled, accepting_orders, settings, whatsapp_phone, social_links, site_template_id, is_demo, whatsapp_orders_enabled, catalog_template_id, catalog_template_version, catalog_review_status, catalog_approved_at),
      role:tenant_roles(id, name, permissions)
    `
    )
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = memberships ?? [];
  if (list.length === 0) return NextResponse.json([]);

  const tenantIds = list.map((m) => (m as { tenant_id: string }).tenant_id);
  const { data: addresses } = await supabase
    .from("tenant_addresses")
    .select("tenant_id, street, city, state, postal_code, country, phone")
    .in("tenant_id", tenantIds);

  const { data: salesConfigs } = await supabase
    .from("tenant_sales_config")
    .select("tenant_id, monthly_rent, monthly_sales_objective")
    .in("tenant_id", tenantIds);

  const addressByTenant: Record<string, { street?: string; city?: string; state?: string; postal_code?: string; country?: string; phone?: string }> = {};
  for (const a of addresses ?? []) {
    const t = a as { tenant_id: string; street?: string; city?: string; state?: string; postal_code?: string; country?: string; phone?: string };
    addressByTenant[t.tenant_id] = {
      street: t.street ?? undefined,
      city: t.city ?? undefined,
      state: t.state ?? undefined,
      postal_code: t.postal_code ?? undefined,
      country: t.country ?? undefined,
      phone: t.phone ?? undefined,
    };
  }

  const salesConfigByTenant: Record<string, { monthly_rent: number; monthly_sales_objective: number }> = {};
  for (const s of salesConfigs ?? []) {
    const row = s as { tenant_id: string; monthly_rent: number; monthly_sales_objective: number };
    salesConfigByTenant[row.tenant_id] = {
      monthly_rent: Number(row.monthly_rent) || 0,
      monthly_sales_objective: Number(row.monthly_sales_objective) || 0,
    };
  }

  const withAddress = list.map((m) => {
    const item = m as unknown as {
      tenant_id: string;
      tenant: Record<string, unknown>;
    };
    const tenantData = Array.isArray(item.tenant) ? item.tenant[0] : item.tenant;
    return {
      ...item,
      tenant: {
        ...(typeof tenantData === "object" && tenantData !== null ? tenantData : {}),
        address: addressByTenant[item.tenant_id] ?? null,
        sales_config: salesConfigByTenant[item.tenant_id] ?? null,
      },
    };
  });

  return NextResponse.json(withAddress);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, business_type, site_template_id, catalog_template_key, registration_intent } = body as {
    name: string;
    slug: string;
    business_type?: string;
    site_template_id?: string;
    catalog_template_key?: string;
    registration_intent?: RegistrationIntent;
  };

  if (!name || !slug) {
    return NextResponse.json(
      { error: "name and slug are required" },
      { status: 400 }
    );
  }

  const baseSlug = slug
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") || "negocio";
  const storedIntent = user.user_metadata?.registration_intent as
    | { plan?: string; giro?: string; solution_key?: string; catalog_key?: string; business_name?: string; theme_key?: string; primary_goals?: string[]; catalog_start_mode?: string; onboarding_session_id?: string; phone?: string; assisted?: boolean; consumed_at?: string; tenant_id?: string }
    | undefined;
  const storedRegistrationIntent = storedIntent?.consumed_at ? undefined : storedIntent;
  const effectivePlan = registration_intent?.plan ?? storedRegistrationIntent?.plan ?? "free";
  const effectiveGiro = registration_intent?.giro ?? storedRegistrationIntent?.giro ?? "otro";
  const effectiveSolutionKey = registration_intent?.solutionKey ?? storedRegistrationIntent?.solution_key ?? null;
  const effectiveCatalogStartMode = registration_intent?.catalogStartMode ?? storedRegistrationIntent?.catalog_start_mode ?? "starter";
  const effectiveOnboardingSessionId = registration_intent?.onboardingSessionId ?? storedRegistrationIntent?.onboarding_session_id ?? null;
  const effectiveGoals = registration_intent?.primaryGoals ?? storedRegistrationIntent?.primary_goals ?? [];
  const effectivePhone = normalizeMexicanPhone(
    registration_intent?.phone ?? storedRegistrationIntent?.phone ?? "",
  );
  const effectiveThemeKey = registration_intent?.themeKey ?? storedRegistrationIntent?.theme_key ?? "tlaco";
  const effectiveAssisted = registration_intent?.assisted ?? storedRegistrationIntent?.assisted ?? false;
  const effectiveBusinessType = business_type || effectiveGiro;
  const requestedCatalogKey = catalog_template_key?.trim() || registration_intent?.catalogKey || storedRegistrationIntent?.catalog_key || null;
  const effectiveCatalogKey = effectiveCatalogStartMode === "own" ? null : requestedCatalogKey;

  if (!effectivePhone) {
    return NextResponse.json(
      { error: "Ingresa un WhatsApp mexicano válido de 10 dígitos antes de crear el negocio." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // A retry after account creation must resume the same business instead of
  // creating a duplicate (for example after a slow redirect or lost network).
  if (registration_intent && storedIntent?.tenant_id) {
    const { data: existingMembership } = await admin
      .from("tenant_memberships")
      .select("tenant:tenants(id, slug)")
      .eq("user_id", user.id)
      .eq("tenant_id", storedIntent.tenant_id)
      .eq("status", "active")
      .maybeSingle();
    const existingTenant = Array.isArray(existingMembership?.tenant)
      ? existingMembership.tenant[0]
      : existingMembership?.tenant;
    if (existingTenant) return NextResponse.json(existingTenant);
  }

  if (effectiveCatalogKey) {
    await ensureCatalogTemplates(admin);
  }

  // Los presets comparten un nombre inicial. Resolver el slug aquí permite
  // que dos negocios elijan ese nombre sin convertir el alta en un error.
  let normalizedSlug = baseSlug;
  const { data: occupiedSlug } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", normalizedSlug)
    .maybeSingle();
  if (occupiedSlug) {
    const ownerSuffix = user.id.replace(/-/g, "").slice(0, 6);
    normalizedSlug = `${baseSlug}-${ownerSuffix}`;
    const { data: occupiedOwnerSlug } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", normalizedSlug)
      .maybeSingle();
    if (occupiedOwnerSlug) {
      normalizedSlug = `${baseSlug}-${ownerSuffix}-${Date.now().toString(36).slice(-4)}`;
    }
  }

  const expansion = await getAdditionalBusinessAccess(admin, user.id);
  if (!expansion.can_create) {
    return NextResponse.json(
      { error: expansion.requires_upgrade ? "Llegaste al límite de negocios de tu plan. Actualiza tu plan para crear otro." : "Llegaste al límite de negocios de tu plan." },
      { status: 403 },
    );
  }

  const { data: created, error: tenantError } = await admin.rpc(
    "create_tenant_with_catalog",
    {
      p_owner_user_id: user.id,
      p_name: name.trim(),
      p_slug: normalizedSlug,
      p_business_type: effectiveBusinessType,
      p_catalog_template_key: effectiveCatalogKey,
      p_site_template_id: site_template_id ?? null,
      p_is_demo: false,
      p_demo_key: null,
    },
  );
  const tenant = Array.isArray(created) ? created[0] : created;

  if (tenantError) {
    if (tenantError.code === "23505") {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: tenantError.message }, { status: 500 });
  }

  if (tenant?.id) {
    await admin
      .from("tenants")
      .update({
        catalog_review_status: effectiveCatalogKey ? "pending" : "not_required",
        public_store_enabled: true,
        accepting_orders: false,
        whatsapp_phone: effectivePhone,
        theme_color: effectiveThemeKey === "ink" ? "#18243a" : effectiveThemeKey === "terracotta" ? "#b45309" : "#3483fa",
        settings: {
          registration_intent: {
            plan: effectivePlan,
            giro: effectiveGiro,
            solution_key: effectiveSolutionKey,
            catalog_start_mode: effectiveCatalogStartMode,
            assisted: effectiveAssisted,
          },
          onboarding: {
            status: "in_progress",
            session_id: effectiveOnboardingSessionId,
            goals: effectiveGoals,
            required_steps: ["contact", "catalog", "availability", "payment", "customer_preview"],
            completed_steps: [],
          },
        },
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", tenant.id);
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        registration_intent: {
          ...(user.user_metadata?.registration_intent ?? {}),
          consumed_at: new Date().toISOString(),
          tenant_id: tenant.id,
        },
      },
    });
  }

  return NextResponse.json(tenant);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    tenant_id,
    name,
    description,
    logo_url,
    theme_color,
    public_store_enabled,
    site_template_id,
    address,
    settings: settingsPayload,
    monthly_rent,
    monthly_sales_objective,
    whatsapp_phone,
    whatsapp_orders_enabled,
    social_links,
  } = body as {
    tenant_id: string;
    name?: string;
    description?: string;
    logo_url?: string | null;
    theme_color?: string;
    public_store_enabled?: boolean;
    site_template_id?: string | null;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      phone?: string;
    };
    settings?: Record<string, unknown>;
    monthly_rent?: number;
    monthly_sales_objective?: number;
    whatsapp_phone?: string;
    whatsapp_orders_enabled?: boolean;
    social_links?: { instagram?: string; facebook?: string; twitter?: string };
  };

  if (!tenant_id) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("role:tenant_roles(name, permissions), status")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant_id)
    .single();

  const membershipLifecycle = membership as unknown as { status?: string; role?: unknown } | null;
  if (!membershipLifecycle || membershipLifecycle.status === "suspended" || membershipLifecycle.status === "invited") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rawRole = membershipLifecycle.role as
    | { name: string; permissions: string[] }
    | { name: string; permissions: string[] }[]
    | null
    | undefined;
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const canWrite =
    role &&
    (role.name === "owner" ||
      (Array.isArray(role.permissions) &&
        role.permissions.includes("settings.write")));

  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: TenantUpdate = {
    updated_at: new Date().toISOString(),
  };
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined)
    updates.description = description?.trim() ?? null;
  if (logo_url !== undefined)
    updates.logo_url = logo_url?.trim() || null;
  if (theme_color !== undefined)
    updates.theme_color = theme_color?.trim() || null;
  if (public_store_enabled !== undefined)
    updates.public_store_enabled = public_store_enabled;
  if (site_template_id !== undefined)
    updates.site_template_id = site_template_id || null;
  const normalizedWhatsApp =
    whatsapp_phone !== undefined ? normalizeMexicanPhone(whatsapp_phone) : null;
  if (whatsapp_phone !== undefined) {
    if (!normalizedWhatsApp) {
      return NextResponse.json(
        { error: "Ingresa un WhatsApp mexicano válido de 10 dígitos." },
        { status: 400 },
      );
    }
    updates.whatsapp_phone = normalizedWhatsApp;
  }
  if (whatsapp_orders_enabled !== undefined) {
    const phoneToValidate = normalizedWhatsApp || (await admin.from("tenants").select("whatsapp_phone, is_demo").eq("id", tenant_id).maybeSingle()).data?.whatsapp_phone;
    if (whatsapp_orders_enabled && (!phoneToValidate || !/^\+[1-9]\d{7,14}$/.test(phoneToValidate))) {
      return NextResponse.json({ error: "Configura un WhatsApp en formato internacional antes de recibir pedidos por ese canal." }, { status: 400 });
    }
    const { data: tenantFlags } = await admin.from("tenants").select("is_demo").eq("id", tenant_id).maybeSingle();
    if (whatsapp_orders_enabled && tenantFlags?.is_demo) {
      return NextResponse.json({ error: "Los negocios demo no pueden activar pedidos reales por WhatsApp." }, { status: 403 });
    }
    (updates as TenantUpdate & { whatsapp_orders_enabled?: boolean }).whatsapp_orders_enabled = whatsapp_orders_enabled;
  }
  if (social_links !== undefined)
    updates.social_links = social_links && typeof social_links === "object" ? social_links : {};

  if (settingsPayload !== undefined) {
    const { data: existingTenant } = await admin
      .from("tenants")
      .select("settings")
      .eq("id", tenant_id)
      .single();
    const current = (existingTenant?.settings as Record<string, unknown>) ?? {};
    const nextSettings = { ...current, ...settingsPayload };
    if (settingsPayload.onboarding && typeof settingsPayload.onboarding === "object" && !Array.isArray(settingsPayload.onboarding)) {
      nextSettings.onboarding = {
        ...((current.onboarding as Record<string, unknown> | null) ?? {}),
        ...(settingsPayload.onboarding as Record<string, unknown>),
      };
    }
    updates.settings = nextSettings as Json;
  }

  const { data: tenant, error } = await admin
    .from("tenants")
    .update(updates)
    .eq("id", tenant_id)
    .select("id, name, slug, description, logo_url, theme_color, public_store_enabled, settings, whatsapp_phone, whatsapp_orders_enabled, social_links, site_template_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (address !== undefined) {
    const addrData = {
      street: address.street?.trim() || null,
      city: address.city?.trim() || null,
      state: address.state?.trim() || null,
      postal_code: address.postal_code?.trim() || null,
      country: address.country?.trim() || null,
      phone: address.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { data: existing } = await admin
      .from("tenant_addresses")
      .select("id")
      .eq("tenant_id", tenant_id)
      .single();

    if (existing) {
      await admin
        .from("tenant_addresses")
        .update(addrData)
        .eq("tenant_id", tenant_id);
    } else {
      await admin.from("tenant_addresses").insert({
        tenant_id,
        ...addrData,
      });
    }
  }

  if (monthly_rent !== undefined || monthly_sales_objective !== undefined) {
    const { data: existingConfig } = await admin
      .from("tenant_sales_config")
      .select("tenant_id, monthly_rent, monthly_sales_objective")
      .eq("tenant_id", tenant_id)
      .single();

    const now = new Date().toISOString();
    const newRent = monthly_rent !== undefined ? Math.max(0, Number(monthly_rent)) : (existingConfig ? Number((existingConfig as { monthly_rent: number }).monthly_rent) : 0);
    const newObjective = monthly_sales_objective !== undefined ? Math.max(0, Number(monthly_sales_objective)) : (existingConfig ? Number((existingConfig as { monthly_sales_objective: number }).monthly_sales_objective) : 0);

    if (existingConfig) {
      await admin
        .from("tenant_sales_config")
        .update({ monthly_rent: newRent, monthly_sales_objective: newObjective, updated_at: now })
        .eq("tenant_id", tenant_id);
    } else {
      await admin.from("tenant_sales_config").insert({
        tenant_id,
        monthly_rent: newRent,
        monthly_sales_objective: newObjective,
        updated_at: now,
      });
    }
  }

  return NextResponse.json(tenant);
}
