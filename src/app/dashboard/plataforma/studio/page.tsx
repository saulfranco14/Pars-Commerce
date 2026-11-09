import { StudioPlatformPage } from "@/features/studio/components/StudioPlatformPage";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Operación de Studio",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const client = await createClient(),
    {
      data: { user },
    } = await client.auth.getUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fplataforma%2Fstudio");
  if (!(await isPlatformAdmin(user.id))) notFound();
  return <StudioPlatformPage />;
}
