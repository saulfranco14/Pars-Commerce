import { randomInt } from "node:crypto";

import {
  buildStaffUsername,
  isStaffLoginEmail,
  loginIdentifierToEmail,
  staffUsernameOf,
} from "@/lib/auth/staffLogin";
import { staffPasswordError } from "@/lib/auth/staffPassword";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { permissionsBeyondActor } from "@/features/equipo/helpers/rolePermissions";

import type { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Staff accounts are created by the business with a password it chooses, no
 * invite email. `app_metadata.created_by_tenant_id` (writable only with the
 * service role) marks which business may later change that password; an
 * account the person created on their own is never touched by a business.
 */

/**
 * A role can only be assigned inside its own tenant, ownership is never handed
 * out from Equipo, and a non-owner can't hand out more than their own role holds.
 */
export async function assertAssignableRole(
  admin: Admin,
  tenantId: string,
  roleId: string,
  actorUserId: string,
): Promise<ServiceResult<{ roleName: string }>> {
  const { data: role } = await admin
    .from("tenant_roles")
    .select("id, name, tenant_id, permissions")
    .eq("id", roleId)
    .maybeSingle();

  if (!role || role.tenant_id !== tenantId) {
    return { ok: false, error: { code: "validation", message: "El rol no pertenece a este negocio." } };
  }
  if (role.name === "owner") {
    return {
      ok: false,
      error: { code: "conflict", message: "La propiedad del negocio no se asigna desde Equipo." },
    };
  }
  const actor = await requirePermission(actorUserId, tenantId, "team.write");
  if (!actor) return { ok: false, error: { code: "forbidden", message: "Tu rol no puede administrar el equipo." } };
  if (permissionsBeyondActor(actor, (role.permissions as string[] | null) ?? []).length > 0) {
    return {
      ok: false,
      error: { code: "forbidden", message: "Ese rol tiene permisos que el tuyo no tiene; solo el propietario puede darlo." },
    };
  }
  return { ok: true, data: { roleName: role.name } };
}

const USERNAME_ATTEMPTS = 5;

/**
 * Creates the login. Without `email` it picks a free username
 * (`nombre.1234`); a clash only retries with another suffix.
 */
export async function createStaffAccount(
  admin: Admin,
  input: { email?: string; displayName: string; tenantId: string; password: string },
): Promise<ServiceResult<{ userId: string; username: string | null }>> {
  if (isStaffLoginEmail(input.email)) {
    return { ok: false, error: { code: "validation", message: "Ese correo no es válido. Déjalo vacío para crear un usuario." } };
  }
  const passwordError = staffPasswordError(input.password);
  if (passwordError) return { ok: false, error: { code: "validation", message: passwordError } };
  const attempts = input.email ? 1 : USERNAME_ATTEMPTS;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const username = input.email
      ? null
      : buildStaffUsername(input.displayName, String(randomInt(1000, 10000)));
    const email = input.email ?? loginIdentifierToEmail(username!);

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { display_name: input.displayName },
      app_metadata: { created_by_tenant_id: input.tenantId },
    });
    if (error?.code === "email_exists" && username) continue;
    if (error || !data.user) {
      return {
        ok: false,
        error: { code: "internal", message: `No se pudo crear la cuenta: ${error?.message ?? "sin respuesta"}` },
      };
    }

    const profile = await upsertStaffProfile(admin, data.user.id, email, input.displayName);
    if (!profile.ok) return profile;
    return { ok: true, data: { userId: data.user.id, username } };
  }

  return {
    ok: false,
    error: { code: "conflict", message: "No encontramos un usuario libre. Intenta de nuevo." },
  };
}

async function upsertStaffProfile(
  admin: Admin,
  userId: string,
  email: string,
  displayName: string,
): Promise<ServiceResult<null>> {
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: userId, email, display_name: displayName }, { onConflict: "id" });
  if (profileError) {
    return {
      ok: false,
      error: { code: "internal", message: `La cuenta se creó pero no su perfil: ${profileError.message}` },
    };
  }
  return { ok: true, data: null };
}

/** Whether this business may set the password of an account (it created it and the account lives only here). */
export async function canManageStaffPassword(admin: Admin, tenantId: string, userId: string): Promise<boolean> {
  const { data: target } = await admin.auth.admin.getUserById(userId);
  if (target.user?.app_metadata?.created_by_tenant_id !== tenantId) return false;
  // Once the account is also in another business (even as its owner), this
  // one must not be able to take it over by changing the password.
  const { count: otherBusinesses } = await admin
    .from("tenant_memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("tenant_id", tenantId);
  return (otherBusinesses ?? 0) === 0 && !(await isPlatformAdmin(userId));
}

export async function setStaffPassword(
  admin: Admin,
  input: { tenantId: string; membershipId: string; password: string },
): Promise<ServiceResult<{ userId: string; username: string | null }>> {
  const passwordError = staffPasswordError(input.password);
  if (passwordError) return { ok: false, error: { code: "validation", message: passwordError } };

  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("id, tenant_id, user_id, role_id")
    .eq("id", input.membershipId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  if (!membership) {
    return { ok: false, error: { code: "not_found", message: "Esa persona no está en el equipo." } };
  }

  const { data: role } = await admin.from("tenant_roles").select("name").eq("id", membership.role_id).maybeSingle();
  if (role?.name === "owner") {
    return { ok: false, error: { code: "conflict", message: "La contraseña del propietario no se cambia desde Equipo." } };
  }

  if (!(await canManageStaffPassword(admin, input.tenantId, membership.user_id))) {
    return {
      ok: false,
      error: {
        code: "conflict",
        message: "Esta persona usa su propia cuenta. Solo ella puede cambiar su contraseña desde su perfil.",
      },
    };
  }

  const { data: target, error } = await admin.auth.admin.updateUserById(membership.user_id, {
    password: input.password,
  });
  if (error) {
    return { ok: false, error: { code: "internal", message: `No se pudo cambiar la contraseña: ${error.message}` } };
  }
  return {
    ok: true,
    data: { userId: membership.user_id, username: staffUsernameOf(target.user?.email) },
  };
}
