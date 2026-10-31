import { isWithinSendWindow, localClock } from "@/features/growth/helpers/sendWindow";
import { runEmailSequence } from "@/features/growth/services/emailSequenceService";
import { processInboxes } from "@/features/growth/services/inboxService";
import { recordOutcome } from "@/features/growth/services/leadService";
import { notifyOperators } from "@/features/growth/services/operatorService";
import { runPendingImports } from "@/features/growth/services/importService";
import { TLACO_WORKSPACE_ID } from "@/features/growth/constants/workspace";
import { getSettings } from "@/features/growth/services/settingsService";
import { dayStats, startOfMexicoDay, statsText } from "@/features/growth/services/statsService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { EmailRunResult } from "@/features/growth/services/emailSequenceService";
import type { InboxRunResult } from "@/features/growth/services/inboxService";

export interface TickResult {
  paused: boolean;
  inWindow: boolean;
  whatsappNoAnswer: number;
  releasedReservations: number;
  email: EmailRunResult | null;
  inbox: InboxRunResult | null;
  /** Import jobs advanced this tick. */
  imports: number;
  digestSent: boolean;
}

/** Two unanswered WhatsApps (or one ignored for two weeks) mean "no answer": the lead moves on. */
async function closeQuietWhatsapps(db: GrowthDb): Promise<number> {
  const day = 86_400_000;
  const [{ data: twice }, { data: stale }] = await Promise.all([
    db.from("growth_leads").select("id").eq("phone_status", "enviado").gte("whatsapp_attempts", 2).lt("last_whatsapp_at", new Date(Date.now() - 4 * day).toISOString()).limit(50),
    db.from("growth_leads").select("id").eq("phone_status", "enviado").eq("whatsapp_attempts", 1).lt("last_whatsapp_at", new Date(Date.now() - 14 * day).toISOString()).limit(50),
  ]);
  const ids = [...(twice ?? []), ...(stale ?? [])].map((row: { id: string }) => row.id);
  for (const id of ids) await recordOutcome(db, { leadId: id, outcome: "whatsapp_no_answer", actor: "system" });
  return ids.length;
}

/** Cards left unmarked for a day stop showing in /pendientes and go back to the queue. */
async function releaseStaleReservations(db: GrowthDb): Promise<number> {
  const { data } = await db
    .from("growth_leads")
    .update({ reserved_kind: null, reserved_until: null })
    .not("reserved_kind", "is", null)
    .lt("reserved_until", new Date(Date.now() - 86_400_000).toISOString())
    .select("id");
  return (data ?? []).length;
}

export async function runTick(db: GrowthDb, now = new Date()): Promise<TickResult> {
  const settings = await getSettings(db);
  const inWindow = isWithinSendWindow(now, settings);
  const result: TickResult = {
    paused: settings.paused,
    inWindow,
    whatsappNoAnswer: await closeQuietWhatsapps(db),
    releasedReservations: await releaseStaleReservations(db),
    email: null,
    inbox: null,
    imports: 0,
    digestSent: false,
  };

  if (!settings.paused && inWindow) result.email = await runEmailSequence(db, settings, now);
  result.inbox = await processInboxes(db);
  result.imports = await runPendingImports(db);

  const clock = localClock(now, settings.timezone);
  if (clock.hour >= settings.digest_hour && settings.last_digest_on !== clock.date) {
    await db.from("growth_settings").update({ last_digest_on: clock.date }).eq("workspace_id", TLACO_WORKSPACE_ID);
    const stats = await dayStats(db, startOfMexicoDay(now));
    await notifyOperators(db, { text: `${statsText(`Cierre del día · ${clock.date}`, stats)}\n\n/pendientes · /calientes · /registros` });
    result.digestSent = true;
  }
  return result;
}
