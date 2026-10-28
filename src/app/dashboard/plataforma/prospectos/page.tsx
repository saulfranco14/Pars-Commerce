"use client";

import { Suspense } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { LeadsView } from "@/features/growth/components/admin/LeadsView";

export default function ProspectosPage() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader eyebrow="Plataforma" title="Prospectos" description="Negocios del DENUE en el oriente, su etapa y el siguiente canal para contactarlos." />
      <Suspense fallback={<LoadingBlock message="Cargando prospectos…" variant="skeleton" />}>
        <LeadsView />
      </Suspense>
    </div>
  );
}
