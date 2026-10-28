"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Eye, Pause, Play } from "lucide-react";

import { useTemplateEditor } from "@/features/growth/hooks/useTemplateEditor";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { FormInput } from "@/components/ui/FormInput";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";

import { GIRO_COPY, GIRO_KEYS } from "@/features/growth/constants/giroCopy";
import { TEMPLATE_STEPS, TEMPLATE_VARIABLES } from "@/features/growth/constants/templateVariables";

import type { TemplateChannel, TemplateStep, TemplateVariant } from "@/features/growth/interfaces/template";

const CHANNEL_TABS = [{ value: "whatsapp", label: "WhatsApp" }, { value: "email", label: "Correo" }] as const;
const VARIANT_TABS = [{ value: "A", label: "Variante A" }, { value: "B", label: "Variante B" }, { value: "C", label: "Variante C" }] as const;
const selectClass = "input-form min-h-11 w-full rounded-xl border border-border bg-surface-raised px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function TemplateEditorView() {
  const editor = useTemplateEditor();
  const { selection, live, inherited } = editor;

  if (editor.isLoading) return <LoadingBlock message="Cargando mensajes…" variant="skeleton" />;
  if (editor.error) return <EmptyState icon={AlertTriangle} title="No pudimos cargar los mensajes" tone="muted" />;

  return (
    <div className="grid grid-cols-1 gap-5">
      <Link href="/dashboard/plataforma/motor" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />Motor
      </Link>
      {editor.notice ? <Notification tone={editor.notice.tone} message={editor.notice.message} onDismiss={editor.clearNotice} /> : null}

      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <FilterTabs tabs={CHANNEL_TABS} activeValue={selection.channel} onTabChange={(value) => editor.select({ channel: value as TemplateChannel })} ariaLabel="Canal" />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Giro
            <select value={selection.giro} onChange={(event) => editor.select({ giro: event.target.value })} className={selectClass}>
              <option value="">Todos los giros (general)</option>
              {GIRO_KEYS.map((key) => <option key={key} value={key}>{GIRO_COPY[key].label}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Paso
            <select value={selection.step} onChange={(event) => editor.select({ step: event.target.value as TemplateStep })} className={selectClass}>
              {TEMPLATE_STEPS[selection.channel].map((step) => <option key={step.value} value={step.value}>{step.label}</option>)}
            </select>
          </label>
        </div>
        <FilterTabs tabs={VARIANT_TABS} activeValue={selection.variant} onTabChange={(value) => editor.select({ variant: value as TemplateVariant })} ariaLabel="Variante" />
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {live ? (
            <>
              <StatusBadge tone={live.status === "active" ? "success" : "neutral"} label={live.status === "active" ? `Activa · v${live.version}` : `Pausada · v${live.version}`} compact />
              <button type="button" disabled={editor.busy} onClick={editor.toggleLive} className={adminActionButtonSecondary}>
                {live.status === "active" ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                {live.status === "active" ? "Pausar variante" : "Activar variante"}
              </button>
            </>
          ) : inherited ? (
            <span>Este giro usa el mensaje general. Si guardas, se crea uno propio para este giro.</span>
          ) : (
            <span>No hay mensaje en este espacio. Si guardas, se crea la versión 1.</span>
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        {selection.channel === "email" ? (
          <FormInput label="Asunto" value={editor.subject} onChange={(event) => editor.setSubject(event.target.value)} maxLength={120} />
        ) : null}
        <label className="grid gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Mensaje</span>
          <textarea
            value={editor.body}
            onChange={(event) => editor.setBody(event.target.value)}
            rows={10}
            className="input-form w-full resize-y rounded-2xl border-2 border-border bg-surface-raised px-4 py-3 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <div className="flex flex-wrap gap-2" aria-label="Variables">
          {TEMPLATE_VARIABLES.map((variable) => (
            <button key={variable.key} type="button" title={variable.label} onClick={() => editor.insertVariable(variable.key)} className="rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 font-mono text-xs text-foreground hover:border-accent/50">
              {`{${variable.key}}`}
            </button>
          ))}
        </div>
        {selection.channel === "email" ? (
          <p className="text-xs text-muted-foreground">El pie con el link de baja, tu dirección y el aviso de privacidad lo agrega el sistema y no se puede quitar.</p>
        ) : null}
        {editor.errors.length ? <Notification tone="warning" message={editor.errors.join(" ")} /> : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={editor.runPreview} disabled={!editor.body} className={adminActionButtonSecondary}><Eye className="h-4 w-4" aria-hidden />Vista previa</button>
          <button type="button" onClick={editor.save} disabled={editor.busy || !editor.dirty || editor.errors.length > 0} className={adminActionButtonPrimary}>
            {editor.busy ? "Guardando…" : `Guardar versión ${(editor.versions[0]?.version ?? 0) + 1}`}
          </button>
        </div>
        {editor.preview ? (
          <div className="grid gap-2 rounded-2xl border border-border-soft bg-surface-raised p-4">
            <span className="text-xs font-semibold text-muted-foreground">Así le llega a {editor.preview.leadName}</span>
            {editor.preview.subject ? <p className="text-sm font-bold text-foreground">{editor.preview.subject}</p> : null}
            <p className="whitespace-pre-line text-sm text-foreground">{editor.preview.body}</p>
          </div>
        ) : null}
      </section>

      {editor.versions.length > 0 ? (
        <section className="grid gap-2 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h3 className="text-base font-bold text-foreground">Versiones</h3>
          <ol className="grid gap-2">
            {editor.versions.map((version) => (
              <li key={version.id} className="grid gap-1 rounded-xl border border-border-soft bg-surface-raised p-3 text-sm">
                <span className="font-semibold text-foreground">v{version.version} · {version.status === "archived" ? "archivada" : version.status === "active" ? "activa" : "pausada"} · {new Date(version.created_at).toLocaleDateString("es-MX")}</span>
                <span className="line-clamp-2 text-muted-foreground">{version.body}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">Cuántos registros trajo cada versión está en Embudo.</p>
        </section>
      ) : null}
    </div>
  );
}
