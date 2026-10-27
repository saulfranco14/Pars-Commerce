import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LockKeyhole, Smartphone, Store } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { ParaActions } from "@/features/growth/components/para/ParaActions";
import { ParaStorePreview } from "@/features/growth/components/para/ParaStorePreview";
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
      <header className="flex min-h-16 items-center justify-between border-b border-border-soft px-5 sm:px-8">
        <TlacoLogo size="md" />
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <LockKeyhole className="h-3.5 w-3.5" aria-hidden />
          Vista privada
        </span>
      </header>

      <section className="bg-accent px-5 pb-10 pt-8 text-accent-foreground sm:px-8">
        <div className="mx-auto grid max-w-3xl gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent-foreground/80">Hecha para {data.businessName}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Así se vería tu tienda en Tlaco</h1>
          <p className="max-w-xl text-base text-accent-foreground/90">
            Tus clientes la abren desde su celular, eligen y te pagan sin descargar nada y sin terminal.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-foreground/15 px-3 py-1.5"><Store className="h-4 w-4" aria-hidden />{data.giroLabel} · {data.place}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-foreground/15 px-3 py-1.5"><Smartphone className="h-4 w-4" aria-hidden />Plan Gratis $0</span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-3xl gap-6 px-5 py-8 sm:px-8">
        <ParaActions token={token} claimUrl={data.claimUrl} helpUrl={data.helpUrl} />
        <div className="grid gap-3">
          <h2 className="text-xl font-bold tracking-tight">Lo que ya trae</h2>
          <p className="text-sm text-muted-foreground">Precios de referencia. Al activarla los cambias, agregas los tuyos o quitas los que no vendes.</p>
          <ParaStorePreview items={data.items} />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Vista de ejemplo preparada por Tlaco para {data.businessName}. No está publicada ni aparece en buscadores.
        </p>
      </section>
    </main>
  );
}
