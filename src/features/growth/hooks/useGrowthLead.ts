import { useCallback, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { assignLeads, followUpLead, isBoardKey, isLeadsListKey, leadKey, patchLead } from "@/features/growth/services/growthClient";
import { forgetWhatsappOpened } from "@/features/growth/services/whatsappOpened";
import { swrFetcher } from "@/lib/swrFetcher";

import type { FollowUpAction, FollowUpInput, LeadDetail, LeadOutcome } from "@/features/growth/interfaces/lead";
import type { SentWhatsapp } from "@/features/growth/interfaces/whatsapp";

const FOLLOW_UP_NOTICE: Record<FollowUpAction, string> = {
  schedule_visit: "Cita agendada. Ya está en la columna «Cita agendada».",
  reschedule_visit: "Cita cambiada.",
  cancel_visit: "Cita cancelada: regresa a «Respondió».",
  remind: "Listo, te lo recordamos en esa fecha.",
  pause: "Pausado. Vuelve a «Para hoy» en la fecha que elegiste.",
  resume: "Reactivado.",
  note: "Nota guardada.",
};

const OUTCOME_NOTICE: Partial<Record<LeadOutcome, string>> = {
  whatsapp_sent: "Quedó como enviado. Su seguimiento queda en 3 días.",
  whatsapp_replied: "Pasó a «Respondió». Contéstale o agenda la cita.",
  email_replied: "Pasó a «Respondió». Contéstale o agenda la cita.",
  no_whatsapp: "Marcado sin WhatsApp: sigue por correo o visita.",
  wrong_number: "Marcado como número equivocado: sigue por correo o visita.",
  not_interested: "Dado de baja. Ya no aparece en «Por trabajar».",
};

export function useGrowthLead(id: string) {
  const { data, error, isLoading, mutate } = useSWR<LeadDetail>(leadKey(id), swrFetcher);
  const { mutate: mutateGlobal } = useSWRConfig();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  async function run(action: () => Promise<unknown>, success: string): Promise<boolean> {
    setBusy(true);
    try {
      await action();
      setNotice({ tone: "success", message: success });
      await Promise.all([mutate(), mutateGlobal(isLeadsListKey), mutateGlobal(isBoardKey)]);
      return true;
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "No pudimos guardar el cambio." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return {
    detail: data,
    error,
    isLoading,
    busy,
    notice,
    clearNotice,
    markOutcome: async (outcome: LeadOutcome, reason?: string, sent?: SentWhatsapp) => {
      const saved = await run(() => patchLead(id, { outcome, reason, sent }), OUTCOME_NOTICE[outcome] ?? "Listo, quedó registrado.");
      if (saved) forgetWhatsappOpened();
      return saved;
    },
    followUp: (input: FollowUpInput) => run(() => followUpLead(id, input), FOLLOW_UP_NOTICE[input.action]),
    snooze: (days: number | null) => run(() => patchLead(id, { snoozeDays: days }), days ? `Pausado ${days} días.` : "Reactivado."),
    updatePhone: (phone: string) => run(() => patchLead(id, { phone }), "Teléfono actualizado. Vuelve a la fila de WhatsApp."),
    logReply: (reply: string) => run(() => patchLead(id, { outcome: "whatsapp_replied", reply }), "Quedó su respuesta en la conversación."),
    reassign: (ownerId: string | null) => run(() => assignLeads([id], ownerId), ownerId ? "Listo, ya lo trabaja otra persona." : "Quedó sin asignar."),
    refresh: () => Promise.all([mutate(), mutateGlobal(isLeadsListKey), mutateGlobal(isBoardKey)]),
    updateGiro: (giro: string) => run(() => patchLead(id, { giro }), "Giro actualizado. Su «Para ti» ya muestra la tienda de ese giro."),
  };
}
