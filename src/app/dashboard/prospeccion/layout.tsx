"use client";

import { ProspectingGate } from "@/features/growth/components/admin/ProspectingGate";

export default function ProspeccionLayout({ children }: { children: React.ReactNode }) {
  return <ProspectingGate>{children}</ProspectingGate>;
}
