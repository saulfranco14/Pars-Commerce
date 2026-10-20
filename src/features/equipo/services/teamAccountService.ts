import { randomInt } from "node:crypto";

import {
  buildStaffUsername,
  isStaffLoginEmail,
  loginIdentifierToEmail,
  staffUsernameOf,
} from "@/lib/auth/staffLogin";
import { generateTempPassword } from "@/lib/auth/tempPassword";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";

import type { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Staff accounts a business creates get a temporary password instead of an
 * email invite: the person can log in right away and must pick their own
 * password on first entry. `app_metadata.created_by_tenant_id` (writable only
 * with the service role) marks which business may later reset it; an account
 * the person created on their own is never resettable by a business.
 */

/** A role can only be assigned inside its own tenant, and ownership is never handed out from Equipo. */
export async function assertAssignableRole(
  admin: Admin,
  tenantId: string,
  roleId: string,
): Promise<ServiceResult<{ roleName: string }>> {
  const { data: role } = await admin
    .from("tenant_roles")
    .select("id, name, tenant_id")
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
  return { ok: true, data: { roleName: role.name } };
}

const USERNAME_ATTEMPTS = 5;

/**
 * Creates the login. Without `email` it picks a free username
 * (`nombre.1234`); a clash only retries with another suffix.
 */
export async function createStaffAccount(
  admin: Admin,
  input: { email?: string; displayName: string; tenantId: string },
): Promise<ServiceResult<{ userId: string; tempPassword: string; username: string | null }>> {
  if (isStaffLoginEmail(input.email)) {
    return { ok: false, error: { code: "validation", message: "Ese correo no es válido. Déjalo vacío para crear un usuario." } };
  }
  const tempPassword = generateTempPassword();
  const attempts = input.email ? 1 : USERNAME_ATTEMPTS;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const username = input.email
      ? null
      : buildStaffUsername(input.displayName, String(randomInt(1000, 10000)));
    const email = input.email ?? loginIdentifierToEmail(username!);

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { display_name: input.displayName, must_change_password: true },
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
    return { ok: true, data: { userId: data.user.id, tempPassword, username } };
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

export async function resetStaffPassword(
  admin: Admin,
  input: { tenantId: string; membershipId: string },
): Promise<ServiceResult<{ userId: string; tempPassword: string; username: string | null }>> {
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

  const { data: target } = await admin.auth.admin.getUserById(membership.user_id);
  if (!target.user) {
    return { ok: false, error: { code: "not_found", message: "No encontramos la cuenta de esa persona." } };
  }
  if (target.user.app_metadata?.created_by_tenant_id !== input.tenantId) {
    return {
      ok: false,
      error: {
        code: "conflict",
        message: "Esta persona creó su propia cuenta. Puede cambiar su contraseña con «¿Olvidaste tu contraseña?» al iniciar sesión.",
      },
    };
  }

  // Once the account is also in another business (even as its owner), this
  // one must not be able to take it over by resetting the password.
  const { count: otherBusinesses } = await admin
    .from("tenant_memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", membership.user_id)
    .neq("tenant_id", input.tenantId);
  if ((otherBusinesses ?? 0) > 0 || (await isPlatformAdmin(membership.user_id))) {
    return {
      ok: false,
      error: {
        code: "conflict",
        message: "Esta persona también usa su cuenta en otro negocio, así que solo ella puede cambiar su contraseña desde su perfil.",
      },
    };
  }

  const tempPassword = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(membership.user_id, {
    password: tempPassword,
    user_metadata: { ...target.user.user_metadata, must_change_password: true },
  });
  if (error) {
    return { ok: false, error: { code: "internal", message: `No se pudo restablecer: ${error.message}` } };
  }
  return {
    ok: true,
    data: { userId: membership.user_id, tempPassword, username: staffUsernameOf(target.user.email) },
  };
}
