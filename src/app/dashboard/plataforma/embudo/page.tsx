"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { FunnelView } from "@/features/growth/components/admin/FunnelView";

export default function EmbudoPage() {
  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Plataforma" title="Embudo" description="Cuántos se registran por el motor, asistidos o solos, y dónde se caen." />
      <FunnelView />
    </div>
  );
}
