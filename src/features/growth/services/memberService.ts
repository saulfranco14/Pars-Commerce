import { GROWTH_MUNICIPIOS } from "@/features/growth/constants/growthRoles";
import { TLACO_WORKSPACE_ID } from "@/features/growth/constants/workspace";
import { internalError } from "@/features/growth/services/growthDb";
import { getAppUrl } from "@/lib/env/appUrl";
import { sendEmail } from "@/lib/email/sendgrid";
import { normalizeMexicanPhone } from "@/lib/phone";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GrowthDb } from "@/features/growth/services/growthDb";
import type {
  GrowthActor,
  GrowthMember,
  GrowthMemberStats,
  GrowthRole,
  GrowthTeam,
  GrowthZone,
  MemberInviteInput,
  MemberInviteResult,
  MemberPatch,
} from "@/features/growth/interfaces/member";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const MEMBER_COLUMNS = "user_id, role, status, display_name, signature, whatsapp_e164, zones, daily_goal, invited_at, joined_at";
const ROLES: GrowthRole[] = ["coordinador", "prospector"];
const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const EMPTY_STATS: GrowthMemberStats = { active: 0, replied: 0, registered: 0 };

type MemberRow = Omit<GrowthMember, "email" | "stats">;

function toActor(workspace: { id: string; name: string; tenant_id: string | null }, role: GrowthRole, row: MemberRow): GrowthActor {
  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    tenantId: workspace.tenant_id,
    userId: row.user_id,
    role,
    displayName: row.display_name,
    signature: row.signature,
    whatsappE164: row.whatsapp_e164,
    zones: row.zones ?? [],
    dailyGoal: row.daily_goal,
  };
}

/**
 * Null when the user cannot work this workspace. The role always comes from SQL (growth_member_role), so a
 * business that removes someone's permission removes their access; the member row only keeps zones and signature.
 */
export async function resolveActor(db: GrowthDb, userId: string, workspaceId = TLACO_WORKSPACE_ID): Promise<GrowthActor | null> {
  const [{ data: role }, { data: workspace }] = await Promise.all([
    db.rpc("growth_member_role", { p_workspace_id: workspaceId, p_user_id: userId }),
    db.from("growth_workspaces").select("id, name, tenant_id").eq("id", workspaceId).maybeSingle(),
  ]);
  if ((role !== "coordinador" && role !== "prospector") || !workspace) return null;

  const { data: row } = await db.from("growth_members").select(MEMBER_COLUMNS).eq("workspace_id", workspaceId).eq("user_id", userId).maybeSingle();
  if (row) {
    if (row.status === "invited") {
      await db.from("growth_members").update({ status: "active", joined_at: new Date().toISOString() }).eq("workspace_id", workspaceId).eq("user_id", userId);
    }
    return toActor(workspace, role, row as MemberRow);
  }

  const { data: profile } = await db.from("profiles").select("display_name, email").eq("id", userId).maybeSingle();
  const name = (profile?.display_name as string | null)?.trim() || (profile?.email as string | null)?.split("@")[0] || "Coordinador";
  // In a business's workspace the team comes from its own members: keep a row so zones and signature can be set.
  if (workspace.tenant_id) {
    const { data: created } = await db
      .from("growth_members")
      .upsert({ workspace_id: workspaceId, user_id: userId, role, status: "active", display_name: name.slice(0, 80), signature: `${name} · ${workspace.name}`.slice(0, 80), joined_at: new Date().toISOString() }, { onConflict: "workspace_id,user_id" })
      .select(MEMBER_COLUMNS)
      .maybeSingle();
    if (created) return toActor(workspace, role, created as MemberRow);
  }
  // A platform admin coordinates Tlaco without a member row.
  return { workspaceId, workspaceName: workspace.name, tenantId: workspace.tenant_id, userId, role, displayName: name, signature: null, whatsappE164: null, zones: [], dailyGoal: 20 };
}

/** The workspace a request works on: a business the user chose (cookie), if their plan and role allow it, else Tlaco. */
export async function chosenWorkspace(db: GrowthDb, userId: string, choice: string | undefined): Promise<string> {
  if (!choice || choice === "tlaco" || !/^[0-9a-f-]{36}$/i.test(choice)) return TLACO_WORKSPACE_ID;
  const { data } = await db.rpc("growth_tenant_workspace", { p_tenant_id: choice, p_user_id: userId });
  return (data as string | null) ?? TLACO_WORKSPACE_ID;
}

/** How a prospect reaches the person who works it: «Para ti» shows this name and WhatsApp. */
export async function memberContact(db: GrowthDb, workspaceId: string, userId: string): Promise<{ displayName: string; signature: string | null; whatsappE164: string | null } | null> {
  const { data } = await db.from("growth_members").select("display_name, signature, whatsapp_e164").eq("workspace_id", workspaceId).eq("user_id", userId).maybeSingle();
  if (!data) return null;
  return { displayName: data.display_name as string, signature: (data.signature as string | null) ?? null, whatsappE164: (data.whatsapp_e164 as string | null) ?? null };
}

/** Owner names for cards and the detail header. */
export async function memberNames(db: GrowthDb, workspaceId: string, userIds: string[]): Promise<Record<string, string>> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return {};
  const [{ data: members }, { data: profiles }] = await Promise.all([
    db.from("growth_members").select("user_id, display_name").eq("workspace_id", workspaceId).in("user_id", ids),
    db.from("profiles").select("id, display_name, email").in("id", ids),
  ]);
  const names: Record<string, string> = {};
  for (const profile of (profiles ?? []) as Array<{ id: string; display_name: string | null; email: string | null }>) {
    names[profile.id] = profile.display_name?.trim() || profile.email?.split("@")[0] || "Alguien del equipo";
  }
  for (const member of (members ?? []) as Array<{ user_id: string; display_name: string }>) names[member.user_id] = member.display_name;
  return names;
}

function cleanZones(zones: unknown): GrowthZone[] | null {
  if (!Array.isArray(zones) || zones.length > 40) return null;
  const clean: GrowthZone[] = [];
  for (const zone of zones) {
    const municipio = typeof zone?.municipio === "string" ? zone.municipio.trim().slice(0, 80) : "";
    if (!municipio) return null;
    const colonias = Array.isArray(zone.colonias)
      ? [...new Set((zone.colonias as unknown[]).filter((c): c is string => typeof c === "string").map((c) => c.trim().slice(0, 80)).filter(Boolean))].slice(0, 60)
      : [];
    clean.push(colonias.length ? { municipio, colonias } : { municipio });
  }
  return clean;
}

export async function listTeam(db: GrowthDb, actor: GrowthActor): Promise<ServiceResult<GrowthTeam>> {
  const { data, error } = await db.from("growth_members").select(MEMBER_COLUMNS).eq("workspace_id", actor.workspaceId).order("invited_at");
  if (error) return internalError(error.message);
  const rows = (data ?? []) as MemberRow[];
  const ids = rows.map((row) => row.user_id);

  const [{ data: profiles }, { data: owned }] = await Promise.all([
    ids.length ? db.from("profiles").select("id, email").in("id", ids) : Promise.resolve({ data: [] }),
    ids.length
      ? db.from("growth_leads").select("owner_user_id, stage, phone_status, email_status").eq("workspace_id", actor.workspaceId).in("owner_user_id", ids).limit(20000)
      : Promise.resolve({ data: [] }),
  ]);
  const emails = new Map(((profiles ?? []) as Array<{ id: string; email: string | null }>).map((row) => [row.id, row.email]));
  const stats = new Map<string, GrowthMemberStats>();
  for (const lead of (owned ?? []) as Array<{ owner_user_id: string; stage: string; phone_status: string; email_status: string }>) {
    const current = stats.get(lead.owner_user_id) ?? { ...EMPTY_STATS };
    if (lead.stage === "registrado") current.registered += 1;
    else if (lead.stage !== "descartado" && lead.stage !== "sin_respuesta") current.active += 1;
    if (lead.phone_status === "respondio" || lead.email_status === "respondio") current.replied += 1;
    stats.set(lead.owner_user_id, current);
  }

  const members = rows.map((row) => ({ ...row, zones: row.zones ?? [], email: emails.get(row.user_id) ?? null, stats: stats.get(row.user_id) ?? { ...EMPTY_STATS } }));
  const covered = new Set(members.filter((m) => m.status !== "suspended").flatMap((m) => m.zones.map((zone) => zone.municipio)));
  return { ok: true, data: { members, uncovered: GROWTH_MUNICIPIOS.filter((municipio) => !covered.has(municipio)) } };
}

function inviteEmailHtml(input: { name: string; inviter: string; url: string; existing: boolean }): string {
  const action = input.existing ? "Entrar a Prospección" : "Crear mi contraseña y entrar";
  return `<p>Hola ${input.name},</p><p>${input.inviter} te agregó al equipo de prospección de Tlaco. Ahí verás los negocios que te tocan, qué mensaje mandarle a cada uno y cómo va cada quien.</p><p><a href="${input.url}">${action}</a></p><p>Si no esperabas este correo, puedes ignorarlo.</p>`;
}

export async function inviteMember(
  admin: SupabaseClient,
  db: GrowthDb,
  actor: GrowthActor,
  input: MemberInviteInput,
): Promise<ServiceResult<MemberInviteResult>> {
  const email = input.email?.trim().toLowerCase() ?? "";
  const name = input.display_name?.trim() ?? "";
  if (!EMAIL.test(email)) return { ok: false, error: { code: "validation", message: "Escribe un correo válido." } };
  if (name.length < 2 || name.length > 80) return { ok: false, error: { code: "validation", message: "Escribe su nombre (2 a 80 caracteres)." } };
  if (!ROLES.includes(input.role)) return { ok: false, error: { code: "validation", message: "Elige el rol." } };
  const whatsapp = input.whatsapp?.trim() ? normalizeMexicanPhone(input.whatsapp) : null;
  if (input.whatsapp?.trim() && !whatsapp) return { ok: false, error: { code: "validation", message: "Escribe los 10 dígitos de su WhatsApp." } };
  const zones = cleanZones(input.zones ?? []);
  if (!zones) return { ok: false, error: { code: "validation", message: "Revisa las zonas." } };
  const signature = (input.signature?.trim() || `${name} · Tlaco`).slice(0, 80);

  const { data: profile } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  let userId = (profile?.id as string | undefined) ?? null;
  let url = `${getAppUrl()}/login?next=${encodeURIComponent("/dashboard/prospeccion")}`;
  if (userId) {
    const { data: existing } = await db.from("growth_members").select("status").eq("workspace_id", actor.workspaceId).eq("user_id", userId).maybeSingle();
    if (existing) return { ok: false, error: { code: "conflict", message: "Esa persona ya está en el equipo." } };
  } else {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { data: { display_name: name }, redirectTo: url },
    });
    if (error || !data.user) return { ok: false, error: { code: "validation", message: error?.message ?? "No pudimos preparar su acceso." } };
    userId = data.user.id;
    url = data.properties?.action_link ?? url;
  }

  const { data: row, error: insertError } = await db
    .from("growth_members")
    .insert({
      workspace_id: actor.workspaceId,
      user_id: userId,
      role: input.role,
      status: "invited",
      display_name: name,
      signature,
      whatsapp_e164: whatsapp,
      zones,
      invited_by: actor.userId,
    })
    .select(MEMBER_COLUMNS)
    .single();
  if (insertError) return internalError(insertError.message);

  let emailDelivery: MemberInviteResult["emailDelivery"] = "sent";
  try {
    await sendEmail({
      to: email,
      subject: `${actor.displayName} te invitó a prospectar con Tlaco`,
      html: inviteEmailHtml({ name, inviter: actor.displayName, url, existing: Boolean(profile?.id) }),
    });
  } catch {
    emailDelivery = "failed";
  }
  return { ok: true, data: { member: { ...(row as MemberRow), email, stats: { ...EMPTY_STATS } }, emailDelivery } };
}

export async function updateMember(db: GrowthDb, actor: GrowthActor, userId: string, patch: MemberPatch): Promise<ServiceResult<GrowthMember>> {
  const fields: Record<string, unknown> = {};
  if (patch.role !== undefined) {
    if (!ROLES.includes(patch.role)) return { ok: false, error: { code: "validation", message: "Elige el rol." } };
    fields.role = patch.role;
  }
  if (patch.status !== undefined) {
    if (patch.status !== "active" && patch.status !== "suspended") return { ok: false, error: { code: "validation", message: "Estado no válido." } };
    fields.status = patch.status;
  }
  if (patch.display_name !== undefined) {
    const name = patch.display_name.trim();
    if (name.length < 2 || name.length > 80) return { ok: false, error: { code: "validation", message: "Escribe su nombre (2 a 80 caracteres)." } };
    fields.display_name = name;
  }
  if (patch.signature !== undefined) {
    const signature = patch.signature.trim();
    if (signature.length < 2 || signature.length > 80) return { ok: false, error: { code: "validation", message: "La firma debe tener entre 2 y 80 caracteres." } };
    fields.signature = signature;
  }
  if (patch.whatsapp !== undefined) {
    const whatsapp = patch.whatsapp.trim() ? normalizeMexicanPhone(patch.whatsapp) : null;
    if (patch.whatsapp.trim() && !whatsapp) return { ok: false, error: { code: "validation", message: "Escribe los 10 dígitos de su WhatsApp." } };
    fields.whatsapp_e164 = whatsapp;
  }
  if (patch.zones !== undefined) {
    const zones = cleanZones(patch.zones);
    if (!zones) return { ok: false, error: { code: "validation", message: "Revisa las zonas." } };
    fields.zones = zones;
  }
  if (patch.daily_goal !== undefined) {
    const goal = Math.round(patch.daily_goal);
    if (!Number.isFinite(goal) || goal < 1 || goal > 200) return { ok: false, error: { code: "validation", message: "La meta diaria va de 1 a 200." } };
    fields.daily_goal = goal;
  }
  if (!Object.keys(fields).length) return { ok: false, error: { code: "validation", message: "Nada que cambiar." } };

  const losesCoordination = (fields.role && fields.role !== "coordinador") || fields.status === "suspended";
  if (userId === actor.userId && losesCoordination) {
    return { ok: false, error: { code: "validation", message: "No puedes quitarte tu propio rol de coordinador ni suspenderte." } };
  }

  const { data, error } = await db
    .from("growth_members")
    .update(fields)
    .eq("workspace_id", actor.workspaceId)
    .eq("user_id", userId)
    .select(MEMBER_COLUMNS)
    .maybeSingle();
  if (error) return internalError(error.message);
  if (!data) return { ok: false, error: { code: "not_found", message: "Esa persona ya no está en el equipo." } };

  if (fields.status === "suspended") {
    await db.from("growth_leads").update({ reserved_until: null, reserved_kind: null, reserved_by: null }).eq("workspace_id", actor.workspaceId).eq("reserved_by", userId);
  }
  const { data: profile } = await db.from("profiles").select("email").eq("id", userId).maybeSingle();
  return { ok: true, data: { ...(data as MemberRow), zones: (data as MemberRow).zones ?? [], email: (profile?.email as string | null) ?? null, stats: { ...EMPTY_STATS } } };
}

/** Coordinators move prospects between people; the SQL side checks the role again. */
export async function assignLeads(db: GrowthDb, actor: GrowthActor, leadIds: string[], ownerId: string | null): Promise<ServiceResult<{ moved: number }>> {
  const { data, error } = await db.rpc("growth_assign_leads", {
    p_workspace_id: actor.workspaceId,
    p_actor_id: actor.userId,
    p_lead_ids: leadIds,
    p_owner_id: ownerId,
  });
  if (error) {
    if (error.message.includes("COORDINATOR_ONLY")) return { ok: false, error: { code: "forbidden", message: "Solo el coordinador puede reasignar." } };
    if (error.message.includes("NOT_A_MEMBER")) return { ok: false, error: { code: "validation", message: "Esa persona no está en el equipo." } };
    return internalError(error.message);
  }
  return { ok: true, data: { moved: Number(data ?? 0) } };
}
