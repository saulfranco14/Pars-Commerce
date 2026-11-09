import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import { StudioLab } from "@/features/studio/components/StudioLab";

export const metadata: Metadata = {
  title: "Laboratorio de Studio",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function StudioLabPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    redirect("/login?next=%2Fdashboard%2Fplataforma%2Fstudio%2Fpruebas");
  if (!(await isPlatformAdmin(user.id))) notFound();
  return <StudioLab />;
}
