"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Loader2, RotateCcw, Undo2 } from "lucide-react";

import { useMenuEditor } from "@/features/configuracion/hooks/useMenuEditor";
import { PageHeader } from "@/components/admin/PageHeader";
import { Notification } from "@/components/ui/Notification";
import { btnPrimary, btnSecondary } from "@/components/ui/buttonClasses";
import { MenuEditor } from "@/features/configuracion/components/menu/MenuEditor";

export default function MenuSettingsPage() {
  const params = useParams();
  const editor = useMenuEditor();

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24 md:pb-6">
      <Link
        href={`/dashboard/${params.tenantSlug as string}/configuracion`}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a Configuración
      </Link>
      <PageHeader
        title="Personalizar menú"
        description="Ordena y oculta las secciones para todo tu equipo. Cada rol sigue viendo solo lo que su permiso le deja abrir."
      />

      {editor.error && <Notification tone="error" message={editor.error} />}
      {editor.done && !editor.dirty && <Notification tone="success" message="Menú guardado. Tu equipo lo verá al recargar." />}

      <MenuEditor editor={editor} />

      <div className="sticky bottom-20 flex flex-wrap gap-2 rounded-2xl border border-border bg-surface p-3 shadow-lg md:bottom-4">
        <button type="button" onClick={editor.save} disabled={!editor.dirty || editor.saving} className={btnPrimary}>
          {editor.saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
          Guardar menú
        </button>
        {editor.dirty && (
          <button type="button" onClick={editor.discard} className={btnSecondary}>
            <Undo2 className="h-4 w-4" aria-hidden />
            Descartar
          </button>
        )}
        <button type="button" onClick={editor.restore} disabled={editor.saving} className={`${btnSecondary} ml-auto`}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Restablecer
        </button>
      </div>
    </div>
  );
}
