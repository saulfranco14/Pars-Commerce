import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { DeviceEnrollmentScreen } from "@/features/dispositivos/components/DeviceEnrollmentScreen";
import { KioskOrderScreen } from "@/features/dispositivos/components/KioskOrderScreen";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string }>;
}

// Outside /dashboard on purpose: that layout brings the admin sidebar with it.
export default async function KioscoPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { k } = await searchParams;

  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) notFound();

  return (
    <DeviceEnrollmentScreen tenantSlug={slug} enrollKey={k ?? ""}>
      <KioskOrderScreen />
    </DeviceEnrollmentScreen>
  );
}
