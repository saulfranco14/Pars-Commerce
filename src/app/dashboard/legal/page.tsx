import { Suspense } from "react";
import { LegalOpeningCard } from "@/features/legal/components/LegalOpeningCard";

export default function LegalOpeningPage() {
  return <Suspense fallback={<div className="min-h-dvh bg-background" aria-label="Cargando apertura legal" />}><LegalOpeningCard /></Suspense>;
}
