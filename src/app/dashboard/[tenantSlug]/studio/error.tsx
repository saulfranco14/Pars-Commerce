"use client";
import { RefreshCw } from "lucide-react";
import { Notification } from "@/components/ui/Notification";
import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
export default function StudioErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-4">
      <Notification
        tone="error"
        title="Studio no está disponible por el momento"
        message="Tu trabajo se conserva. Si es la primera instalación, completa la configuración de Studio antes de abrirlo."
      />
      <button onClick={reset} className={adminActionButtonSecondary}>
        <RefreshCw className="h-4 w-4" />
        Volver a intentar
      </button>
    </div>
  );
}
