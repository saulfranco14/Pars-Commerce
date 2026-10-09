import { Suspense } from "react";

import { BusinessSetupWizard } from "@/features/onboarding/BusinessSetupWizard";

export default function PrepareBusinessPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-white" aria-label="Preparando negocio" />}>
      <BusinessSetupWizard />
    </Suspense>
  );
}
