"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Loader2, RotateCcw, Undo2 } from "lucide-react";

import { useMenuEditor } from "@/features/configuracion/hooks/useMenuEditor";
import { Notification } from "@/components/ui/Notification";
import { btnWorkPrimary, btnWorkSecondary } from "@/components/ui/buttonClasses";
import { MenuEditor } from "@/features/configuracion/components/menu/MenuEditor";

export default function MenuSettingsPage() {
  const params = useParams();
  const editor = useMenuEditor();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-28">
      <Link
        href={`/dashboard/${params.tenantSlug as string}/configuracion`}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Configuración
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Personalizar menú</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ordena y oculta módulos o secciones para todo tu equipo. Cada rol sigue viendo solo lo que su permiso le deja abrir.
          </p>
        </div>
        <button
          type="button"
          onClick={editor.restore}
          disabled={editor.saving}
          aria-label="Restablecer el menú original"
          title="Restablecer el menú original"
          className="inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:text-foreground active:scale-95 sm:h-11 sm:w-11"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {editor.error && <Notification tone="error" message={editor.error} />}
      {editor.done && !editor.dirty && <Notification tone="success" message="Menú guardado. Tu equipo lo verá al recargar." />}

      <MenuEditor editor={editor} />

      {editor.dirty && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur md:inset-x-auto md:bottom-6 md:left-1/2 md:w-full md:max-w-2xl md:-translate-x-1/2 md:rounded-2xl md:border md:pb-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={editor.discard} disabled={editor.saving} className={btnWorkSecondary}>
              <Undo2 className="h-4 w-4" aria-hidden />
              Descartar
            </button>
            <button type="button" onClick={editor.save} disabled={editor.saving} className={btnWorkPrimary}>
              {editor.saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
