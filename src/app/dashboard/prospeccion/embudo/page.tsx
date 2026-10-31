"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { FunnelView } from "@/features/growth/components/admin/FunnelView";

export default function EmbudoPage() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader eyebrow="Prospección" title="Embudo" description="Cuántos se registran por el motor, asistidos o solos, y dónde se caen." />
      <FunnelView />
    </div>
  );
}
