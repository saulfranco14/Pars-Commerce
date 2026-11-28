"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { AdBackgroundsView } from "@/features/growth/components/admin/AdBackgroundsView";

export default function FondosPage() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader eyebrow="Motor" title="Fondos de anuncios" description="Las imágenes que la IA hace para los anuncios de regalo. Solo las que apruebes llegan a los prospectos." />
      <AdBackgroundsView />
    </div>
  );
}
