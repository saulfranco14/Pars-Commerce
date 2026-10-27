"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { EngineView } from "@/features/growth/components/admin/EngineView";

export default function MotorPage() {
  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Plataforma" title="Motor de ventas" description="Correo automático, buzones de Gmail y el bot de Telegram." />
      <EngineView />
    </div>
  );
}
