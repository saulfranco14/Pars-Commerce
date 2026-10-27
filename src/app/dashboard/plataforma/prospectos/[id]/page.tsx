"use client";

import { use } from "react";

import { LeadDetailView } from "@/features/growth/components/admin/LeadDetailView";

export default function ProspectoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <LeadDetailView id={id} />;
}
