"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { EngineView } from "@/features/growth/components/admin/EngineView";

export default function MotorPage() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader eyebrow="Prospección" title="Motor de ventas" description="Correo automático, buzones de Gmail y el bot de Telegram." />
      <EngineView />
    </div>
  );
}
