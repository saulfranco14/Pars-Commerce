import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Notification } from "@/components/ui/Notification";

import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";

/** Shown instead of crashing the dashboard when Studio's data layer cannot answer. */
export function StudioUnavailable({ tenantSlug }: { tenantSlug: string }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-6">
      <Notification
        tone="warning"
        title="Studio no está disponible por el momento"
        message="Estamos terminando de preparar Studio para tu negocio. Tu catálogo y tus pedidos funcionan con normalidad."
      />
      <Link
        href={`/dashboard/${tenantSlug}`}
        className={`${adminActionButtonSecondary} w-full sm:w-auto`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a mi negocio
      </Link>
    </div>
  );
}
