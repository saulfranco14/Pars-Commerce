"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { ZoneReportView } from "@/features/growth/components/welcome/ZoneReportView";

export default function ZonaPage() {
  return (
    <div className="grid grid-cols-1 gap-5 pb-8">
      <PageHeader eyebrow="Reporte" title="Su zona" description="Cuántos negocios de su giro hay cerca de usted y qué probar para que lo elijan." />
      <ZoneReportView />
    </div>
  );
}
