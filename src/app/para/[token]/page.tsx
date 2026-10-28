import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { ParaActions } from "@/features/growth/components/para/ParaActions";
import { ParaStorefront } from "@/features/growth/components/para/ParaStorefront";
import { ParaTracker } from "@/features/growth/components/para/ParaTracker";
import { ParaVisitButton } from "@/features/growth/components/para/ParaVisitButton";

import { getParaPage } from "@/features/growth/services/paraService";

export const dynamic = "force-dynamic";

type ParaParams = { params: Promise<{ token: string }> };

/** WhatsApp shows this card under the link, so it names the business instead of a generic title. */
export async function generateMetadata({ params }: ParaParams): Promise<Metadata> {
  const data = await getParaPage((await params).token);
  const robots = { index: false, follow: false };
  if (!data) return { title: "Tienda de ejemplo · Tlaco", robots };
  const title = `${data.businessName} · Su tienda de ejemplo`;
  const description = data.sender
    ? `${data.sender.name}, de Tlaco, preparó esta vista para ${data.businessName}. Así la verían sus clientes.`
    : `Así verían los clientes de ${data.businessName} su tienda en línea.`;
  return { title, description, robots, openGraph: { title, description, siteName: "Tlaco", type: "website" } };
}

export default async function ParaPage({ params }: ParaParams) {
  const { token } = await params;
  const data = await getParaPage(token);
  if (!data) notFound();

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <ParaTracker token={token} />
      <header className="sticky top-0 z-30 border-b border-border-soft bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <TlacoLogo size="sm" />
          <ParaActions claimUrl={data.claimUrl} helpUrl={data.helpUrl} helpLabel={data.helpLabel} layout="bar" />
        </div>
      </header>
      <p className="flex items-center justify-center gap-2 bg-foreground px-4 py-2.5 text-center text-xs font-semibold text-balance text-background">
        <LockKeyhole className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Vista privada para {data.businessName}. Sólo usted tiene el link.
      </p>

      <ParaStorefront token={token} data={data} />

      <section data-para-section="cierre" className="border-t border-border-soft bg-surface px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-xl gap-5 text-center">
          <div className="grid gap-2">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Es suya, sin costo.</h2>
            <p className="text-base text-muted-foreground">
              La activa con estos productos y la ajusta a su negocio: precios, fotos, horarios y entregas.
            </p>
          </div>
          <ParaActions claimUrl={data.claimUrl} helpUrl={data.helpUrl} helpLabel={data.helpLabel} layout="block">
            {data.visit ? <ParaVisitButton token={token} offer={data.visit} placement="final" /> : null}
          </ParaActions>
          <p className="text-xs text-muted-foreground">
            Vista de ejemplo preparada por Tlaco para {data.businessName} · {data.giroLabel} · {data.place}. No está publicada ni aparece en buscadores.
          </p>
        </div>
      </section>
    </main>
  );
}
