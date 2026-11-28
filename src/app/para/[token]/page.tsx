import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ParaAdsView } from "@/features/growth/components/para/ParaAdsView";
import { ParaOffer } from "@/features/growth/components/para/ParaOffer";
import { ParaTracker } from "@/features/growth/components/para/ParaTracker";

import { getParaPage } from "@/features/growth/services/paraService";

export const dynamic = "force-dynamic";

type ParaParams = { params: Promise<{ token: string }> };

/** WhatsApp shows this card under the link, so it names the business instead of a generic title. */
export async function generateMetadata({ params }: ParaParams): Promise<Metadata> {
  const data = await getParaPage((await params).token);
  const robots = { index: false, follow: false };
  if (!data) return { title: "Anuncios de regalo · Tlaco", robots };
  if (data.kind === "offer") {
    const title = `${data.workspaceName} · Propuesta para ${data.businessName}`;
    const description = data.sender ? `${data.sender.name}, de ${data.workspaceName}, preparó esta propuesta para ${data.businessName}.` : data.title;
    return { title, description, robots, openGraph: { title, description, siteName: data.workspaceName, type: "website" } };
  }
  const name = data.displayName ?? `su ${data.giroLabel.toLowerCase()}`;
  const title = `Sus anuncios están listos · ${name}`;
  const description = `${data.sender ? `${data.sender.firstName}, de Tlaco,` : "Tlaco"} le hizo 4 anuncios sin costo para su Estado de WhatsApp. Cámbieles el precio y descárguelos.`;
  return { title, description, robots, openGraph: { title, description, siteName: "Tlaco", type: "website" } };
}

export default async function ParaPage({ params }: ParaParams) {
  const { token } = await params;
  const data = await getParaPage(token);
  if (!data) notFound();
  if (data.kind === "offer") {
    return (
      <main className="min-h-dvh bg-background text-foreground">
        <ParaTracker token={token} />
        <ParaOffer data={data} />
      </main>
    );
  }
  return <ParaAdsView token={token} data={data} />;
}
