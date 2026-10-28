"use client";

import { Suspense } from "react";

import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { WhatsappSweepView } from "@/features/growth/components/admin/WhatsappSweepView";

export default function BarridoPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Suspense fallback={<LoadingBlock message="Preparando el barrido…" variant="skeleton" />}>
        <WhatsappSweepView />
      </Suspense>
    </div>
  );
}
