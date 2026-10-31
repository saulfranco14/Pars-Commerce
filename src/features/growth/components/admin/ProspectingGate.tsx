"use client";

import { useState } from "react";
import { Lock, Target } from "lucide-react";

import { useGrowthMe } from "@/features/growth/hooks/useGrowthMe";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";

import { registerInterest } from "@/services/featureInterestService";

/** A business without «prospecting» in its plan sees what it is and can say it wants it. */
export function ProspectingGate({ children }: { children: React.ReactNode }) {
  const { actor, loaded, choice } = useGrowthMe();
  const [interested, setInterested] = useState(false);

  if (!loaded) return <LoadingBlock message="Cargando prospección…" variant="skeleton" />;
  if (actor) return <>{children}</>;

  const tenantId = choice && choice !== "tlaco" ? choice : null;
  if (!tenantId) {
    return <EmptyState icon={Lock} title="No eres parte del equipo de prospección" description="Pídele a quien coordina que te invite." tone="muted" />;
  }
  return (
    <EmptyState
      icon={Target}
      title="Consigue clientes con tu equipo"
      description="Prospección te da negocios de tu zona y giro, el mensaje de WhatsApp listo para cada uno, una página con tu propuesta y el seguimiento hasta que te compran. Viene en el plan Escala; si tu rol no la ve, pide el permiso «Prospectar»."
      action={
        <button
          type="button"
          disabled={interested}
          onClick={async () => {
            await registerInterest({ tenant_id: tenantId, feature_key: "prospecting" }).catch(() => undefined);
            setInterested(true);
          }}
          className={adminActionButtonPrimary}
        >
          {interested ? "Listo, te contactamos" : "Me interesa"}
        </button>
      }
    />
  );
}
