"use client";

import { Suspense } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { ProspectsView } from "@/features/growth/components/admin/ProspectsView";

export default function ProspectosPage() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <PageHeader eyebrow="Plataforma" title="Prospectos" />
      <Suspense fallback={<LoadingBlock message="Cargando prospectos…" variant="skeleton" />}>
        <ProspectsView />
      </Suspense>
    </div>
  );
}
