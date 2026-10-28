"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { TemplateEditorView } from "@/features/growth/components/admin/TemplateEditorView";

export default function MensajesPage() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader eyebrow="Motor" title="Mensajes" description="Edita cada WhatsApp y cada correo por giro y paso. Guardar crea una versión nueva; nada se borra." />
      <TemplateEditorView />
    </div>
  );
}
