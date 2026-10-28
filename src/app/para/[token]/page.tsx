import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { ParaActions } from "@/features/growth/components/para/ParaActions";
import { ParaStorefront } from "@/features/growth/components/para/ParaStorefront";
import { ParaTracker } from "@/features/growth/components/para/ParaTracker";

import { growthDb } from "@/features/growth/services/growthDb";
import { loadParaPage } from "@/features/growth/services/paraService";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Tu tienda de ejemplo · Tlaco", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ParaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await loadParaPage(growthDb(createAdminClient()), token);
  if (!data) notFound();

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <ParaTracker token={token} />
      <header className="sticky top-0 z-30 border-b border-border-soft bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <TlacoLogo size="sm" />
            <span className="hidden min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-muted-foreground sm:inline-flex">
              <LockKeyhole className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Vista privada de la tienda de {data.businessName}
            </span>
          </div>
          <ParaActions token={token} claimUrl={data.claimUrl} helpUrl={data.helpUrl} layout="bar" />
        </div>
      </header>

      <ParaStorefront data={data} />

      <section className="border-t border-border-soft bg-surface px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-xl gap-5 text-center">
          <div className="grid gap-2">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">¿Te gusta? Es tuya, gratis.</h2>
            <p className="text-base text-muted-foreground">
              La activas con estos productos y la ajustas a tu negocio: precios, fotos, horarios y entregas.
            </p>
          </div>
          <ParaActions token={token} claimUrl={data.claimUrl} helpUrl={data.helpUrl} />
          <p className="text-xs text-muted-foreground">
            Vista de ejemplo preparada por Tlaco para {data.businessName} · {data.giroLabel} · {data.place}. No está publicada ni aparece en buscadores.
          </p>
        </div>
      </section>
    </main>
  );
}
