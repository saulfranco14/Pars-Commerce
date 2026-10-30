import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";

import { warmupCap } from "@/features/growth/helpers/warmupCap";
import { internalError } from "@/features/growth/services/growthDb";
import { startOfMexicoDay } from "@/features/growth/services/statsService";

import type { Transporter } from "nodemailer";
import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthMailbox, MailboxInput } from "@/features/growth/interfaces/settings";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const COLUMNS = "id, address, display_name, secret_env_key, daily_cap, warmup_started_on, is_active, paused_reason";
const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const ENV_KEY = /^GROWTH_MAILBOX_[A-Z0-9_]+$/;

export function mailboxPassword(mailbox: Pick<GrowthMailbox, "secret_env_key">): string | null {
  return ENV_KEY.test(mailbox.secret_env_key) ? process.env[mailbox.secret_env_key]?.replace(/\s+/g, "") || null : null;
}

export function smtpTransport(mailbox: Pick<GrowthMailbox, "address" | "secret_env_key">): Transporter | null {
  const pass = mailboxPassword(mailbox);
  if (!pass) return null;
  return nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: mailbox.address, pass } });
}

export function imapClient(mailbox: Pick<GrowthMailbox, "address" | "secret_env_key">): ImapFlow | null {
  const pass = mailboxPassword(mailbox);
  if (!pass) return null;
  return new ImapFlow({ host: "imap.gmail.com", port: 993, secure: true, auth: { user: mailbox.address, pass }, logger: false });
}

/** Messages each mailbox already sent today (Mexico City day). */
export async function sentTodayByMailbox(db: GrowthDb, now = new Date()): Promise<Map<string, number>> {
  const { data } = await db
    .from("growth_messages")
    .select("mailbox_id")
    .eq("direction", "outbound")
    .eq("status", "sent")
    .gte("created_at", startOfMexicoDay(now))
    .limit(5000);
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as Array<{ mailbox_id: string | null }>) {
    if (row.mailbox_id) counts.set(row.mailbox_id, (counts.get(row.mailbox_id) ?? 0) + 1);
  }
  return counts;
}

export async function listMailboxes(db: GrowthDb, workspaceId: string): Promise<GrowthMailbox[]> {
  const { data } = await db.from("growth_mailboxes").select(COLUMNS).eq("workspace_id", workspaceId).order("created_at");
  const sent = await sentTodayByMailbox(db);
  return ((data ?? []) as GrowthMailbox[]).map((mailbox) => ({
    ...mailbox,
    sent_today: sent.get(mailbox.id) ?? 0,
    cap_today: warmupCap(mailbox.warmup_started_on, mailbox.daily_cap, new Date()),
    has_secret: Boolean(mailboxPassword(mailbox)),
  }));
}

export async function createMailbox(db: GrowthDb, workspaceId: string, input: MailboxInput): Promise<ServiceResult<GrowthMailbox>> {
  const address = input.address?.trim().toLowerCase() ?? "";
  const displayName = input.display_name?.trim() ?? "";
  const envKey = input.secret_env_key?.trim().toUpperCase() ?? "";
  const cap = input.daily_cap ?? 30;
  if (!EMAIL.test(address)) return { ok: false, error: { code: "validation", message: "Escribe un correo válido." } };
  if (displayName.length < 2 || displayName.length > 60) return { ok: false, error: { code: "validation", message: "El nombre del remitente debe tener entre 2 y 60 caracteres." } };
  if (!ENV_KEY.test(envKey)) return { ok: false, error: { code: "validation", message: "La variable debe llamarse como GROWTH_MAILBOX_1_PASSWORD." } };
  if (!Number.isInteger(cap) || cap < 1 || cap > 100) return { ok: false, error: { code: "validation", message: "El tope diario va de 1 a 100." } };

  const { data, error } = await db
    .from("growth_mailboxes")
    .insert({ workspace_id: workspaceId, address, display_name: displayName, secret_env_key: envKey, daily_cap: cap })
    .select(COLUMNS)
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, error: { code: "conflict", message: "Ese correo ya está dado de alta." } };
    return internalError(error.message);
  }
  return { ok: true, data: data as GrowthMailbox };
}

export async function updateMailbox(db: GrowthDb, workspaceId: string, id: string, patch: { is_active?: boolean; daily_cap?: number }): Promise<ServiceResult<GrowthMailbox>> {
  const fields: Record<string, unknown> = {};
  if (patch.is_active !== undefined) {
    fields.is_active = patch.is_active;
    if (patch.is_active) fields.paused_reason = null;
  }
  if (patch.daily_cap !== undefined) {
    if (!Number.isInteger(patch.daily_cap) || patch.daily_cap < 1 || patch.daily_cap > 100) {
      return { ok: false, error: { code: "validation", message: "El tope diario va de 1 a 100." } };
    }
    fields.daily_cap = patch.daily_cap;
  }
  const { data, error } = await db.from("growth_mailboxes").update(fields).eq("id", id).eq("workspace_id", workspaceId).select(COLUMNS).maybeSingle();
  if (error) return internalError(error.message);
  if (!data) return { ok: false, error: { code: "not_found", message: "Ese buzón ya no existe." } };
  return { ok: true, data: data as GrowthMailbox };
}

export async function pauseMailbox(db: GrowthDb, id: string, reason: string): Promise<void> {
  await db.from("growth_mailboxes").update({ is_active: false, paused_reason: reason.slice(0, 200) }).eq("id", id);
}

/** Checks the app password on SMTP and IMAP and mails the mailbox itself. */
export async function testMailbox(db: GrowthDb, workspaceId: string, id: string): Promise<ServiceResult<{ smtp: string; imap: string }>> {
  const { data } = await db.from("growth_mailboxes").select(COLUMNS).eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  if (!data) return { ok: false, error: { code: "not_found", message: "Ese buzón ya no existe." } };
  const mailbox = data as GrowthMailbox;
  const transport = smtpTransport(mailbox);
  if (!transport) {
    return { ok: false, error: { code: "validation", message: `No encuentro la variable ${mailbox.secret_env_key} en el servidor. Agrégala en Vercel y vuelve a desplegar.` } };
  }

  let smtp = "ok";
  try {
    await transport.verify();
    await transport.sendMail({
      from: { name: mailbox.display_name, address: mailbox.address },
      to: mailbox.address,
      subject: "Prueba del motor de Tlaco",
      text: "Si ves este correo, el motor ya puede enviar desde este buzón.",
    });
  } catch (error) {
    smtp = `Falló el envío: ${error instanceof Error ? error.message : "error desconocido"}. Revisa la contraseña de aplicación.`;
  }

  let imap = "ok";
  const client = imapClient(mailbox);
  try {
    await client?.connect();
    await client?.logout();
  } catch (error) {
    imap = `Falló la lectura: ${error instanceof Error ? error.message : "error desconocido"}. Revisa que IMAP esté habilitado.`;
  }
  return { ok: true, data: { smtp, imap } };
}
