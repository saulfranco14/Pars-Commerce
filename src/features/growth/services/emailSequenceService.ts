import { EMAIL_STEP_GAPS_DAYS, EMAIL_STEPS, emailFooter } from "@/features/growth/helpers/emailFooter";
import { warmupCap } from "@/features/growth/helpers/warmupCap";
import { createLeadLink, leadLinkUrl } from "@/features/growth/services/leadLinkService";
import { recordOutcome } from "@/features/growth/services/leadService";
import { pauseMailbox, sentTodayByMailbox, smtpTransport } from "@/features/growth/services/mailboxService";
import { notifyOperators } from "@/features/growth/services/operatorService";
import { renderForLead, resolveTemplate } from "@/features/growth/services/templateService";
import { escapeHtml } from "@/features/growth/services/telegramApi";
import { getPublicAppUrl } from "@/lib/env/appUrl";

import type { Transporter } from "nodemailer";
import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthMailbox, GrowthSettings } from "@/features/growth/interfaces/settings";
import type { TemplateVariant } from "@/features/growth/interfaces/template";

interface DueEnrollment {
  enrollment_id: string;
  lead_id: string;
  mailbox_id: string | null;
  variant: TemplateVariant;
  current_step: number;
  thread_message_id: string | null;
  business_name: string;
  giro: string;
  municipio: string;
  colonia: string | null;
  address: string | null;
  email: string;
  stage: string;
  email_status: string;
}

interface Slot {
  mailbox: GrowthMailbox;
  transport: Transporter;
  remaining: number;
}

export interface EmailRunResult {
  enrolled: number;
  sent: number;
  failed: number;
  stopped: number;
  finished: number;
}

const AUTH_ERROR = /invalid login|username and password not accepted|application-specific password|535|534/i;

async function stop(db: GrowthDb, enrollmentId: string, reason: string) {
  await db.from("growth_enrollments").update({ status: "stopped", stop_reason: reason, claimed_until: null }).eq("id", enrollmentId);
}

async function release(db: GrowthDb, enrollmentId: string, minutes: number) {
  await db.from("growth_enrollments").update({ claimed_until: new Date(Date.now() + minutes * 60_000).toISOString() }).eq("id", enrollmentId);
}

async function loadSlots(db: GrowthDb, now: Date): Promise<Slot[]> {
  const { data } = await db.from("growth_mailboxes").select("id, address, display_name, secret_env_key, daily_cap, warmup_started_on, is_active, paused_reason").eq("is_active", true);
  const sent = await sentTodayByMailbox(db, now);
  const slots: Slot[] = [];
  for (const mailbox of (data ?? []) as GrowthMailbox[]) {
    const transport = smtpTransport(mailbox);
    const remaining = warmupCap(mailbox.warmup_started_on, mailbox.daily_cap, now) - (sent.get(mailbox.id) ?? 0);
    if (transport && remaining > 0) slots.push({ mailbox, transport, remaining });
  }
  return slots;
}

/** A thread stays on its mailbox; new threads go to the mailbox with the most room. */
function pickSlot(slots: Slot[], mailboxId: string | null): Slot | null {
  if (mailboxId) return slots.find((slot) => slot.mailbox.id === mailboxId && slot.remaining > 0) ?? null;
  return slots.filter((slot) => slot.remaining > 0).sort((a, b) => b.remaining - a.remaining)[0] ?? null;
}

async function sendOne(db: GrowthDb, item: DueEnrollment, slot: Slot, settings: GrowthSettings): Promise<"sent" | "failed" | "skipped"> {
  const step = EMAIL_STEPS[item.current_step];
  const template = await resolveTemplate(db, { channel: "email", step, giro: item.giro, variant: item.variant });
  if (!template) return "skipped";

  const [paraToken, bajaToken] = await Promise.all([
    createLeadLink(db, { leadId: item.lead_id, purpose: "para", channel: "correo", templateId: template.id }),
    createLeadLink(db, { leadId: item.lead_id, purpose: "baja", channel: "correo" }),
  ]);
  const appUrl = getPublicAppUrl();
  const rendered = renderForLead(template, item, { link: leadLinkUrl(paraToken, "para"), firma: settings.signature });
  const unsubscribeUrl = leadLinkUrl(bajaToken, "baja");
  const text = rendered.body + "\n" + emailFooter({ unsubscribeUrl, postalAddress: process.env.GROWTH_POSTAL_ADDRESS ?? null, privacyUrl: `${appUrl}/privacidad` });
  const subject = rendered.subject ?? item.business_name;

  try {
    const info = await slot.transport.sendMail({
      from: { name: slot.mailbox.display_name, address: slot.mailbox.address },
      to: item.email,
      subject,
      text,
      inReplyTo: item.thread_message_id ?? undefined,
      references: item.thread_message_id ?? undefined,
      headers: {
        "List-Unsubscribe": `<${appUrl}/api/growth/unsubscribe?t=${bajaToken}>, <mailto:${slot.mailbox.address}?subject=baja>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    slot.remaining -= 1;
    await db.from("growth_messages").insert({
      lead_id: item.lead_id,
      enrollment_id: item.enrollment_id,
      mailbox_id: slot.mailbox.id,
      direction: "outbound",
      status: "sent",
      step,
      template_id: template.id,
      from_address: slot.mailbox.address,
      to_address: item.email,
      subject,
      body: text,
      provider_message_id: info.messageId ?? null,
      in_reply_to: item.thread_message_id,
    });
    await recordOutcome(db, { leadId: item.lead_id, outcome: "email_sent", actor: "system", templateId: template.id, payload: { step } });
    await db.from("growth_enrollments").update({
      mailbox_id: slot.mailbox.id,
      current_step: item.current_step + 1,
      next_send_at: new Date(Date.now() + EMAIL_STEP_GAPS_DAYS[item.current_step] * 86_400_000).toISOString(),
      thread_message_id: item.thread_message_id ?? info.messageId ?? null,
      last_sent_at: new Date().toISOString(),
      claimed_until: null,
    }).eq("id", item.enrollment_id);
    return "sent";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[growth] email send failed:", message);
    await db.from("growth_messages").insert({
      lead_id: item.lead_id, enrollment_id: item.enrollment_id, mailbox_id: slot.mailbox.id, direction: "outbound",
      status: "failed", step, template_id: template.id, to_address: item.email, subject, error: message.slice(0, 500),
    });
    if (AUTH_ERROR.test(message)) {
      slot.remaining = 0;
      await pauseMailbox(db, slot.mailbox.id, "Gmail rechazó la contraseña de aplicación");
      await notifyOperators(db, { text: `<b>Pausé el buzón ${escapeHtml(slot.mailbox.address)}</b>: Gmail rechazó la contraseña. Crea una nueva contraseña de aplicación y reactívalo en Plataforma → Motor.` });
    }
    await release(db, item.enrollment_id, 30);
    return "failed";
  }
}

/** Enrolls new email leads up to today's room and sends what is due. Call only inside the send window. */
export async function runEmailSequence(db: GrowthDb, settings: GrowthSettings, now = new Date()): Promise<EmailRunResult> {
  const result: EmailRunResult = { enrolled: 0, sent: 0, failed: 0, stopped: 0, finished: 0 };
  const slots = await loadSlots(db, now);
  const room = slots.reduce((total, slot) => total + slot.remaining, 0);
  if (!room) return result;

  const { count: activeDue } = await db
    .from("growth_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .lte("next_send_at", now.toISOString());
  const toEnroll = Math.max(0, room - (activeDue ?? 0));
  if (toEnroll) {
    const { data } = await db.rpc("growth_enroll_email_leads", { p_limit: toEnroll });
    result.enrolled = Number(data ?? 0);
  }

  const { data: due } = await db.rpc("growth_claim_due_enrollments", { p_limit: Math.min(room + 10, 50) });
  for (const item of (due ?? []) as DueEnrollment[]) {
    if (["registrado", "descartado", "conversando"].includes(item.stage) || ["rebotado", "respondio"].includes(item.email_status)) {
      await stop(db, item.enrollment_id, item.stage === "registrado" ? "registrado" : "respuesta_o_baja");
      result.stopped++;
      continue;
    }
    if (item.current_step >= EMAIL_STEPS.length) {
      await recordOutcome(db, { leadId: item.lead_id, outcome: "email_no_answer", actor: "system" });
      await db.from("growth_enrollments").update({ status: "completed", stop_reason: "sin_respuesta", claimed_until: null }).eq("id", item.enrollment_id);
      result.finished++;
      continue;
    }
    const slot = pickSlot(slots, item.mailbox_id);
    if (!slot) {
      await release(db, item.enrollment_id, 60);
      continue;
    }
    const outcome = await sendOne(db, item, slot, settings);
    if (outcome === "sent") result.sent++;
    else if (outcome === "failed") result.failed++;
    else await release(db, item.enrollment_id, 60);
  }
  return result;
}
