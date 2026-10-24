"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useActiveTenant } from "@/stores/useTenantStore";
import { Notification } from "@/components/ui/Notification";

export function LegalDeferredNotice() {
  const tenant = useActiveTenant();
  const [state, setState] = useState<{ pending?: { tenant_id: string }; collaborator_pending?: { tenant_id: string } } | null>(null);
  useEffect(() => {
    if (!tenant) return;
    void fetch(`/api/legal/status?tenant_id=${encodeURIComponent(tenant.id)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then(setState)
      .catch(() => setState(null));
  }, [tenant?.id]);
  if (!tenant) return null;
  if (state?.pending?.tenant_id === tenant.id) {
    return <Notification tone="info" title="Te falta un paso antes de abrir pedidos" message={<span>Tu catálogo sigue guardado. <Link className="font-bold underline" href={`/dashboard/legal?tenant=${encodeURIComponent(tenant.id)}`}>Completar datos legales</Link></span>} className="mb-4" />;
  }
  if (state?.collaborator_pending?.tenant_id === tenant.id) {
    return <Notification tone="info" title="Falta la apertura legal del negocio" message="La persona propietaria debe completar sus datos y aceptar el acuerdo antes de abrir pedidos. Tu trabajo y el catálogo siguen disponibles." className="mb-4" />;
  }
  return null;
}
