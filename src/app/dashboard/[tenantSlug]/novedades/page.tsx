"use client";

import { useActiveTenant } from "@/stores/useTenantStore";
import { PageHeader } from "@/components/admin/PageHeader";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { NOVEDADES } from "@/features/novedades/constants/catalog";
import { NovedadCard } from "@/features/novedades/components/NovedadCard";
import { useFeatureInterest } from "@/features/novedades/hooks/useFeatureInterest";
import { StudioActionLink } from "@/features/studio/components/StudioActionLink";

export default function NovedadesPage() {
  const tenant = useActiveTenant();
  const tenantId = tenant?.id ?? null;
  const { interested, isLoading, mutate } = useFeatureInterest(tenantId);

  if (!tenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Lo que viene"
        title="Novedades"
        description="Estamos construyendo más para tu negocio. Dinos qué te interesa y te avisaremos apenas esté listo — tu voto nos ayuda a decidir qué hacer primero."
      />

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-bold">Conoce Tlaco Studio</h2>
        <p className="mb-4 mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
          Prepara anuncios con tu catálogo, ajusta sus capas y conserva
          versiones. La membresía se contrata por negocio; editar y exportar
          consume 0 Tlacos. Las generaciones de IA requieren saldo y
          confirmación previa.
        </p>
        <StudioActionLink label="Explorar Studio" wide />
      </section>
      {isLoading ? (
        <LoadingBlock message="Cargando novedades…" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {NOVEDADES.map((n) => (
            <NovedadCard
              key={n.key}
              novedad={n}
              tenantId={tenant.id}
              alreadyInterested={interested.includes(n.key)}
              onInterested={() => mutate()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
