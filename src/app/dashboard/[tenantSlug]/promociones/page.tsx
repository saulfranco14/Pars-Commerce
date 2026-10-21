"use client";

import { useParams } from "next/navigation";

import { OffersPage } from "@/features/promociones/components/OffersPage";

export default function PromocionesPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  return <OffersPage tenantSlug={tenantSlug} />;
}
