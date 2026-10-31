import { simpleParser } from "mailparser";

import { classifyReply, stripQuoted } from "@/features/growth/helpers/classifyReply";
import { recordOutcome } from "@/features/growth/services/leadService";
import { imapClient, pauseMailbox } from "@/features/growth/services/mailboxService";
import { notifyOperators } from "@/features/growth/services/operatorService";
import { escapeHtml } from "@/features/growth/services/telegramApi";

import type { ParsedMail } from "mailparser";
import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthMailbox } from "@/features/growth/interfaces/settings";
import type { ReplyKind } from "@/features/growth/helpers/classifyReply";

const MAX_PER_RUN = 50;
const BOUNCE_PAUSE_RATE = 0.04;
const BOUNCE_MIN_SENT = 20;

interface InboxMailbox extends GrowthMailbox {
  imap_last_uid: number;
  imap_uid_validity: number | null;
}

export interface InboxRunResult {
  read: number;
  replies: number;
  rejections: number;
  bounces: number;
  pausedMailboxes: number;
}

function headerMap(mail: ParsedMail): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of mail.headers) out[key.toLowerCase()] = typeof value === "string" ? value : JSON.stringify(value);
  return out;
}

function referencedIds(mail: ParsedMail): string[] {
  const refs = Array.isArray(mail.references) ? mail.references : mail.references ? [mail.references] : [];
  return [mail.inReplyTo, ...refs].filter((id): id is string => Boolean(id));
}

/** Bounces name the failed address in a header (Gmail) or in the DSN body. */
function bouncedAddress(mail: ParsedMail, headers: Record<string, string>): string | null {
  const direct = headers["x-failed-recipients"]?.replace(/["[\]]/g, "").split(",")[0]?.trim();
  if (direct) return direct.toLowerCase();
  const match = /(?:final|original)-recipient:\s*rfc822;\s*<?([^\s>]+@[^\s>]+)>?/i.exec(mail.text ?? "");
  return match ? match[1].toLowerCase() : null;
}

async function findLead(db: GrowthDb, mail: ParsedMail, kind: ReplyKind, headers: Record<string, string>): Promise<{ id: string; enrollmentId: string | null } | null> {
  const ids = referencedIds(mail);
  if (ids.length) {
    const { data } = await db.from("growth_messages").select("lead_id, enrollment_id").in("provider_message_id", ids).limit(1).maybeSingle();
    if (data?.lead_id) return { id: data.lead_id as string, enrollmentId: (data.enrollment_id as string | null) ?? null };
  }
  const address = kind === "bounce" ? bouncedAddress(mail, headers) : mail.from?.value[0]?.address?.toLowerCase();
  if (!address) return null;
  const { data } = await db.from("growth_leads").select("id").eq("email", address).maybeSingle();
  if (!data) return null;
  const { data: enrollment } = await db.from("growth_enrollments").select("id").eq("lead_id", data.id).maybeSingle();
  return { id: data.id as string, enrollmentId: (enrollment?.id as string | undefined) ?? null };
}

async function handleMail(db: GrowthDb, mailbox: InboxMailbox, mail: ParsedMail, result: InboxRunResult) {
  const headers = headerMap(mail);
  const kind = classifyReply({ from: mail.from?.text ?? "", subject: mail.subject ?? "", text: mail.text ?? "", headers });
  const lead = await findLead(db, mail, kind, headers);

  if (mail.messageId) {
    const { error } = await db.from("growth_messages").insert({
      lead_id: lead?.id ?? null,
      enrollment_id: lead?.enrollmentId ?? null,
      mailbox_id: mailbox.id,
      direction: "inbound",
      status: "received",
      from_address: mail.from?.value[0]?.address ?? null,
      to_address: mailbox.address,
      subject: mail.subject ?? null,
      body: stripQuoted(mail.text ?? "").slice(0, 4000),
      provider_message_id: mail.messageId,
      in_reply_to: mail.inReplyTo ?? null,
      classification: lead ? kind : "unmatched",
    });
    // Already processed in an earlier run.
    if (error?.code === "23505") return;
  }
  if (!lead || kind === "auto_reply") return;

  const stopEnrollment = (reason: string) =>
    lead.enrollmentId ? db.from("growth_enrollments").update({ status: "stopped", stop_reason: reason, claimed_until: null }).eq("id", lead.enrollmentId) : null;

  if (kind === "bounce") {
    result.bounces++;
    await recordOutcome(db, { leadId: lead.id, outcome: "email_bounced", actor: "system" });
    await stopEnrollment("rebote");
    return;
  }
  if (kind === "rejection") {
    result.rejections++;
    await recordOutcome(db, { leadId: lead.id, outcome: "not_interested", actor: "prospect", payload: { reason: "rechazo", via: "correo" } });
    await stopEnrollment("rechazo");
    return;
  }
  result.replies++;
  const updated = await recordOutcome(db, { leadId: lead.id, outcome: "email_replied", actor: "prospect" });
  await stopEnrollment("respondio");
  const name = updated.ok ? updated.data.business_name : mail.from?.text ?? "Un prospecto";
  const snippet = stripQuoted(mail.text ?? "").slice(0, 300);
  await notifyOperators(db, {
    text: `<b>Respondió por correo</b> · ${escapeHtml(name)}\n«${escapeHtml(snippet)}»\n\nContesta desde ${escapeHtml(mailbox.address)}.`,
  }, { ownerId: updated.ok ? updated.data.owner_user_id : null });
}

/** Pauses a mailbox whose 7-day bounce rate passes 4%, before Gmail suspends it. */
async function guardBounces(db: GrowthDb, mailbox: InboxMailbox): Promise<boolean> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [{ count: sent }, { count: bounced }] = await Promise.all([
    db.from("growth_messages").select("id", { count: "exact", head: true }).eq("mailbox_id", mailbox.id).eq("direction", "outbound").eq("status", "sent").gte("created_at", since),
    db.from("growth_messages").select("id", { count: "exact", head: true }).eq("mailbox_id", mailbox.id).eq("classification", "bounce").gte("created_at", since),
  ]);
  if ((sent ?? 0) < BOUNCE_MIN_SENT || (bounced ?? 0) / (sent ?? 1) <= BOUNCE_PAUSE_RATE) return false;
  await pauseMailbox(db, mailbox.id, `Rebotes altos: ${bounced} de ${sent} en 7 días`);
  await notifyOperators(db, { text: `<b>Pausé el buzón ${escapeHtml(mailbox.address)}</b>: ${bounced} rebotes de ${sent} en 7 días. Revisa los rebotes en Plataforma antes de reactivarlo.` });
  return true;
}

export async function processInboxes(db: GrowthDb): Promise<InboxRunResult> {
  const result: InboxRunResult = { read: 0, replies: 0, rejections: 0, bounces: 0, pausedMailboxes: 0 };
  const { data } = await db
    .from("growth_mailboxes")
    .select("id, address, display_name, secret_env_key, daily_cap, warmup_started_on, is_active, paused_reason, imap_last_uid, imap_uid_validity")
    .eq("is_active", true);

  for (const mailbox of (data ?? []) as InboxMailbox[]) {
    const client = imapClient(mailbox);
    if (!client) continue;
    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        const status = client.mailbox && typeof client.mailbox === "object" ? client.mailbox : null;
        const validity = status ? Number(status.uidValidity) : null;
        let lastUid = Number(mailbox.imap_last_uid);
        // First run or a reset mailbox: start from now, never from years of old mail.
        if (validity !== mailbox.imap_uid_validity || lastUid === 0) {
          lastUid = status ? Math.max(0, Number(status.uidNext) - 1) : 0;
        } else {
          let processed = 0;
          for await (const message of client.fetch(`${lastUid + 1}:*`, { uid: true, source: true }, { uid: true })) {
            if (message.uid <= lastUid || !message.source) continue;
            await handleMail(db, mailbox, await simpleParser(message.source), result);
            lastUid = message.uid;
            result.read++;
            if (++processed >= MAX_PER_RUN) break;
          }
        }
        await db.from("growth_mailboxes").update({ imap_last_uid: lastUid, imap_uid_validity: validity }).eq("id", mailbox.id);
      } finally {
        lock.release();
      }
      await client.logout();
    } catch (error) {
      console.error(`[growth] inbox ${mailbox.address} failed:`, error);
      try { await client.logout(); } catch { /* already closed */ }
    }
    if (await guardBounces(db, mailbox)) result.pausedMailboxes++;
  }
  return result;
}
