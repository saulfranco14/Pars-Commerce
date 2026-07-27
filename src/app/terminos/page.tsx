import type { Metadata } from "next";

import { LandingNav } from "@/features/landing/components/sections/LandingNav";
import { LegalDocument } from "@/features/legal/components/LegalDocument";

import { TERMS } from "@/features/legal/constants/terms";

export const metadata: Metadata = {
  title: "Términos de servicio · Tlaco",
  description: "Las reglas de uso de la plataforma Tlaco.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="h-[52px]" aria-hidden />
      <main>
        <LegalDocument doc={TERMS} />
      </main>
    </div>
  );
}
