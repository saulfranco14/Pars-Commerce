import type { Metadata } from "next";

import { LandingNav } from "@/features/landing/components/sections/LandingNav";
import { LegalDocument } from "@/features/legal/components/LegalDocument";

import { PRIVACY } from "@/features/legal/constants/privacy";

export const metadata: Metadata = {
  title: "Aviso de Privacidad · Tlaco",
  description:
    "Qué datos personales tratamos, para qué, y cómo ejercer tus derechos ARCO.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="h-[52px]" aria-hidden />
      <main>
        <LegalDocument doc={PRIVACY} />
      </main>
    </div>
  );
}
