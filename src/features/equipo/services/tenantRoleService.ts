import { requirePermission } from "@/lib/auth/requirePermission";
import { SYSTEM_ROLE_PERMISSIONS } from "@/constants/systemRoles";
import { ROLE_LABELS } from "@/features/equipo/constants/roleDescriptions";
import {
  normalizeRolePermissions,
  permissionsBeyondActor,
  roleNameError,
} from "@/features/equipo/helpers/rolePermissions";
import { asBillingAdmin, getBillingAccount } from "@/features/billing/billingService";
import { PERMISSION_CATALOG } from "@/constants/permissionCatalog";

import type { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

type Admin = ReturnType<typeof createAdminClient>;

interface Actor {
  userId: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

export interface SavedRole {
  id: string;
  name: string;
  permissions: string[];
  is_system: boolean;
}

const fail = (code: "forbidden" | "validation" | "conflict" | "not_found" | "internal", message: string) =>
  ({ ok: false, error: { code, message } }) as const;

const labelOf = (key: string) => PERMISSION_CATALOG.find((p) => p.key === key)?.label ?? key;

/** team.write plus the plan capability; who edits roles is checked on every write. */
async function resolveActor(admin: Admin, userId: string, tenantId: string): Promise<ServiceResult<Actor>> {
  const membership = await requirePermission(userId, tenantId, "team.write");
  if (!membership) return fail("forbidden", "Tu rol no puede administrar roles.");
  const billing = await getBillingAccount(asBillingAdmin(admin), tenantId);
  if (!billing.plan.entitlements.custom_roles) {
    return fail("forbidden", "Editar roles está disponible en un plan superior.");
  }
  return {
    ok: true,
    data: {
      userId,
      roleId: membership.roleId,
      roleName: membership.roleName,
      permissions: membership.permissions,
    },
  };
}

function checkGrant(actor: Actor, permissions: string[]): ServiceResult<null> {
  const beyond = permissionsBeyondActor(actor, permissions);
  if (beyond.length > 0) {
    return fail("forbidden", `No puedes dar permisos que tu rol no tiene: ${beyond.map(labelOf).join(", ")}.`);
  }
  return { ok: true, data: null };
}

async function nameTaken(admin: Admin, tenantId: string, name: string, exceptId?: string): Promise<boolean> {
  const wanted = name.trim().toLowerCase();
  if (Object.entries(ROLE_LABELS).some(([key, label]) => key === wanted || label.toLowerCase() === wanted)) return true;
  const { data } = await admin.from("tenant_roles").select("id, name").eq("tenant_id", tenantId);
  return (data ?? []).some((r) => r.id !== exceptId && r.name.trim().toLowerCase() === wanted);
}

async function loadRole(admin: Admin, tenantId: string, roleId: string) {
  const { data } = await admin
    .from("tenant_roles")
    .select("id, tenant_id, name, permissions, is_system")
    .eq("id", roleId)
    .maybeSingle();
  return data && data.tenant_id === tenantId ? data : null;
}

export async function createRole(
  admin: Admin,
  input: { userId: string; tenantId: string; name: string; permissions: unknown },
): Promise<ServiceResult<SavedRole>> {
  const actor = await resolveActor(admin, input.userId, input.tenantId);
  if (!actor.ok) return actor;

  const nameError = roleNameError(input.name);
  if (nameError) return fail("validation", nameError);
  if (await nameTaken(admin, input.tenantId, input.name)) return fail("conflict", "Ya hay un rol con ese nombre.");

  const normalized = normalizeRolePermissions(input.permissions);
  if (!normalized.ok) return fail("validation", `Permisos desconocidos: ${normalized.unknown.join(", ")}`);
  const grant = checkGrant(actor.data, normalized.permissions);
  if (!grant.ok) return grant;

  const { data, error } = await admin
    .from("tenant_roles")
    .insert({ tenant_id: input.tenantId, name: input.name.trim(), permissions: normalized.permissions, is_system: false })
    .select("id, name, permissions, is_system")
    .single();
  if (error || !data) return fail("internal", error?.message ?? "No se pudo crear el rol.");
  return { ok: true, data: data as SavedRole };
}

export async function updateRole(
  admin: Admin,
  input: { userId: string; tenantId: string; roleId: string; name?: string; permissions?: unknown; reset?: boolean },
): Promise<ServiceResult<SavedRole>> {
  const actor = await resolveActor(admin, input.userId, input.tenantId);
  if (!actor.ok) return actor;

  const role = await loadRole(admin, input.tenantId, input.roleId);
  if (!role) return fail("not_found", "Ese rol no existe en este negocio.");
  if (role.name === "owner") return fail("conflict", "El propietario siempre tiene acceso total.");
  if (actor.data.roleName !== "owner" && actor.data.roleId === role.id) {
    return fail("forbidden", "No puedes cambiar los permisos de tu propio rol.");
  }

  const update: { name?: string; permissions?: string[]; updated_at: string } = { updated_at: new Date().toISOString() };

  if (input.reset) {
    const defaults = SYSTEM_ROLE_PERMISSIONS[role.name];
    if (!role.is_system || !defaults) return fail("validation", "Solo los roles de Tlaco se pueden restablecer.");
    update.permissions = [...defaults];
  } else if (input.permissions !== undefined) {
    const normalized = normalizeRolePermissions(input.permissions);
    if (!normalized.ok) return fail("validation", `Permisos desconocidos: ${normalized.unknown.join(", ")}`);
    update.permissions = normalized.permissions;
  }
  if (update.permissions) {
    const grant = checkGrant(actor.data, update.permissions);
    if (!grant.ok) return grant;
  }

  if (input.name !== undefined && input.name.trim() !== role.name) {
    if (role.is_system) return fail("validation", "Los roles de Tlaco conservan su nombre.");
    const nameError = roleNameError(input.name);
    if (nameError) return fail("validation", nameError);
    if (await nameTaken(admin, input.tenantId, input.name, role.id)) return fail("conflict", "Ya hay un rol con ese nombre.");
    update.name = input.name.trim();
  }

  const { data, error } = await admin
    .from("tenant_roles")
    .update(update)
    .eq("id", role.id)
    .select("id, name, permissions, is_system")
    .single();
  if (error || !data) return fail("internal", error?.message ?? "No se pudo guardar el rol.");
  return { ok: true, data: data as SavedRole };
}

export async function deleteRole(
  admin: Admin,
  input: { userId: string; tenantId: string; roleId: string },
): Promise<ServiceResult<null>> {
  const actor = await resolveActor(admin, input.userId, input.tenantId);
  if (!actor.ok) return actor;

  const role = await loadRole(admin, input.tenantId, input.roleId);
  if (!role) return fail("not_found", "Ese rol no existe en este negocio.");
  if (role.is_system) return fail("conflict", "Los roles de Tlaco no se borran; puedes restablecerlos.");

  const { count } = await admin
    .from("tenant_memberships")
    .select("id", { count: "exact", head: true })
    .eq("role_id", role.id);
  if ((count ?? 0) > 0) return fail("conflict", "Hay personas con este rol. Cámbiales el rol antes de borrarlo.");

  const { error } = await admin.from("tenant_roles").delete().eq("id", role.id);
  if (error) return fail("internal", error.message);
  return { ok: true, data: null };
}
