"use client";

import { Suspense } from "react";

import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { ProspectsView } from "@/features/growth/components/admin/ProspectsView";

export default function ProspectosPage() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Suspense fallback={<LoadingBlock message="Cargando prospectos…" variant="skeleton" />}>
        <ProspectsView />
      </Suspense>
    </div>
  );
}
