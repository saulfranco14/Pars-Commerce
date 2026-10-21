"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";

import { OffersPage } from "@/features/promociones/components/OffersPage";

export default function PromocionesPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  return (
    <Suspense fallback={null}>
      <OffersPage tenantSlug={tenantSlug} />
    </Suspense>
  );
}
