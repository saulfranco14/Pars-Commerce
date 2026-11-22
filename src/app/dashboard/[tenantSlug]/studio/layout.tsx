import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { studioDb } from "@/features/studio/services/studioDb";
import { requireStudioAccess } from "@/features/studio/services/studioAccessService";
import { StudioProvider } from "@/features/studio/components/StudioProvider";
import { StudioError } from "@/features/studio/services/studioErrors";
import { studioFlags } from "@/features/studio/services/studioFlags";
import { StudioUnavailable } from "@/features/studio/components/StudioUnavailable";

export const metadata: Metadata = {
  title: "Tlaco Studio",
  robots: { index: false, follow: false },
};
export default async function StudioLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  if (!studioFlags().enabled) notFound();
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    redirect(
      `/login?next=${encodeURIComponent(`/dashboard/${tenantSlug}/studio`)}`,
    );
  const db = studioDb();
  const { data: tenant } = await db
    .from("tenants")
    .select("id,name")
    .eq("slug", tenantSlug)
    .maybeSingle();
  if (!tenant) notFound();
  try {
    await requireStudioAccess(tenant.id);
  } catch (error) {
    if (
      error instanceof StudioError &&
      ["FORBIDDEN", "NOT_FOUND"].includes(error.code)
    )
      notFound();
    // A missing schema or a database hiccup must not take the whole dashboard down.
    console.error("[studio] access check failed", {
      code: error instanceof StudioError ? error.code : "UNKNOWN",
    });
    return <StudioUnavailable tenantSlug={tenantSlug} />;
  }
  return (
    <StudioProvider
      tenantId={tenant.id}
      tenantSlug={tenantSlug}
      tenantName={tenant.name}
      userId={user.id}
    >
      {children}
    </StudioProvider>
  );
}
