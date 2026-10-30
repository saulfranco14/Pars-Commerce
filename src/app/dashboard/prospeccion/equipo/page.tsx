"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { TeamView } from "@/features/growth/components/admin/TeamView";

export default function EquipoPage() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader eyebrow="Prospección" title="Equipo" description="Invita a quien prospecta, asígnale zonas y ve cómo va cada quien." />
      <TeamView />
    </div>
  );
}
