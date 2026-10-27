"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AlertTriangle, Bot, Mail, MessageSquareText, Pause, Play, Plus } from "lucide-react";

import { useGrowthEngine } from "@/features/growth/hooks/useGrowthEngine";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { MailboxSheet } from "@/features/growth/components/admin/MailboxSheet";

import { engineSettingsSchema } from "@/features/growth/validations/engineSchemas";

import type { EngineSettingsFormValues } from "@/features/growth/validations/engineSchemas";
import type { GrowthSettings } from "@/features/growth/interfaces/settings";

function SettingsForm({ settings, busy, onSave }: { settings: GrowthSettings; busy: boolean; onSave: (values: EngineSettingsFormValues) => void }) {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<EngineSettingsFormValues>({
    resolver: yupResolver(engineSettingsSchema),
    values: { signature: settings.signature, send_start_hour: settings.send_start_hour, send_end_hour: settings.send_end_hour },
  });
  return (
    <form onSubmit={handleSubmit(onSave)} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end" noValidate>
      <FormInput label="Firma de los mensajes" error={errors.signature?.message} {...register("signature")} />
      <FormInput label="Desde (hora)" type="number" inputMode="numeric" error={errors.send_start_hour?.message} {...register("send_start_hour")} />
      <FormInput label="Hasta (hora)" type="number" inputMode="numeric" error={errors.send_end_hour?.message} {...register("send_end_hour")} />
      <button type="submit" disabled={busy || !isDirty} className={adminActionButtonPrimary}>Guardar</button>
    </form>
  );
}

export function EngineView() {
  const engine = useGrowthEngine();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { overview } = engine;

  if (engine.isLoading && !overview) return <LoadingBlock message="Cargando el motor…" variant="skeleton" />;
  if (engine.error || !overview) {
    return <EmptyState icon={AlertTriangle} title="No pudimos cargar el motor" description="Revisa que las migraciones de growth estén aplicadas." tone="muted" />;
  }

  const { settings, mailboxes, telegram } = overview;

  return (
    <div className="grid gap-5">
      {engine.notice ? <Notification tone={engine.notice.tone} message={engine.notice.message} onDismiss={engine.clearNotice} /> : null}
      {!overview.enabled ? (
        <Notification tone="warning" title="El motor está apagado" message="Falta GROWTH_ENABLED=true en las variables de entorno. Mientras tanto no sale ningún correo y el bot no responde." />
      ) : null}
      {!overview.postalAddressSet ? (
        <Notification tone="info" message="Agrega GROWTH_POSTAL_ADDRESS para que el pie de los correos lleve tu dirección." />
      ) : null}

      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="text-base font-bold text-foreground">Correo automático</h2>
            <p className="text-sm text-muted-foreground">
              {settings.paused ? `Pausado · ${settings.paused_reason ?? ""}` : `Envía de ${settings.send_start_hour}:00 a ${settings.send_end_hour}:00, lunes a sábado.`}
            </p>
          </div>
          <button type="button" disabled={engine.busy === "pause"} onClick={() => engine.togglePause(!settings.paused)} className={settings.paused ? adminActionButtonPrimary : adminActionButtonSecondary}>
            {settings.paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
            {settings.paused ? "Reanudar" : "Pausar todo"}
          </button>
        </div>
        <SettingsForm settings={settings} busy={engine.busy === "settings"} onSave={(values) => engine.saveSettings(values)} />
      </section>

      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-foreground">Buzones de Gmail</h2>
          <button type="button" onClick={() => setSheetOpen(true)} className={adminActionButtonSecondary}><Plus className="h-4 w-4" aria-hidden />Agregar buzón</button>
        </div>
        {mailboxes.length === 0 ? (
          <EmptyState icon={Mail} title="Sin buzones" description="Agrega tu Gmail de Tlaco para que el correo salga solo." tone="muted" />
        ) : (
          <div className="grid gap-2">
            {mailboxes.map((mailbox) => (
              <article key={mailbox.id} className="grid gap-3 rounded-xl border border-border-soft bg-surface-raised p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{mailbox.address}</span>
                    <StatusBadge tone={mailbox.is_active ? "success" : "neutral"} label={mailbox.is_active ? "Activo" : "Pausado"} compact />
                    {!mailbox.has_secret ? <StatusBadge tone="warning" label={`Falta ${mailbox.secret_env_key}`} compact /> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {mailbox.display_name} · hoy {mailbox.sent_today ?? 0} de {mailbox.cap_today ?? 0}
                    {mailbox.paused_reason ? ` · ${mailbox.paused_reason}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={engine.busy === `test-${mailbox.id}`} onClick={() => engine.testMailbox(mailbox.id)} className={adminActionButtonSecondary}>
                    {engine.busy === `test-${mailbox.id}` ? "Probando…" : "Probar conexión"}
                  </button>
                  <button type="button" disabled={engine.busy === `toggle-${mailbox.id}`} onClick={() => engine.toggleMailbox(mailbox.id, !mailbox.is_active)} className={mailbox.is_active ? adminActionButtonSecondary : adminActionButtonPrimary}>
                    {mailbox.is_active ? "Pausar" : "Activar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="inline-flex items-center gap-2 text-base font-bold text-foreground"><Bot className="h-4 w-4" aria-hidden />Bot de Telegram</h2>
            <p className="text-sm text-muted-foreground">
              {telegram.configured ? `${telegram.linkedChats} chat(s) vinculado(s).` : "Faltan TELEGRAM_BOT_TOKEN y TELEGRAM_WEBHOOK_SECRET."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!telegram.configured || engine.busy === "webhook"} onClick={() => engine.connectWebhook()} className={adminActionButtonSecondary}>Conectar bot</button>
            <button type="button" disabled={!telegram.configured || engine.busy === "telegram"} onClick={() => engine.linkTelegram()} className={adminActionButtonPrimary}>Vincular mi Telegram</button>
          </div>
        </div>
        {engine.telegramCode ? (
          <Notification
            tone="info"
            title={`Código: ${engine.telegramCode.code}`}
            message={engine.telegramCode.deepLink
              ? <span>Abre <a className="font-semibold underline" href={engine.telegramCode.deepLink} target="_blank" rel="noopener noreferrer">el bot</a> y toca Iniciar, o mándale <code>/start {engine.telegramCode.code}</code>.</span>
              : <span>Mándale al bot <code>/start {engine.telegramCode.code}</code>.</span>}
          />
        ) : null}
      </section>

      <Link href="/dashboard/plataforma/motor/mensajes" className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 font-semibold text-foreground hover:border-accent/40 sm:p-5">
        <span className="inline-flex items-center gap-2"><MessageSquareText className="h-4 w-4" aria-hidden />Mensajes: edita lo que se envía</span>
        <span className="text-sm text-accent">Abrir</span>
      </Link>

      <MailboxSheet isOpen={sheetOpen} nextIndex={mailboxes.length + 1} busy={engine.busy === "mailbox"} onClose={() => setSheetOpen(false)} onSubmit={(values) => engine.addMailbox(values)} />
    </div>
  );
}
