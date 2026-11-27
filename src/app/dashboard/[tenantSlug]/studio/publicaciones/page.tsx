import { redirect } from "next/navigation";
// Where each ad is published now lives in «Anuncios».
export default async function Page({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  redirect(`/dashboard/${(await params).tenantSlug}/studio/disenos`);
}
