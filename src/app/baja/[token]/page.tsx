import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { UnsubscribeConfirm } from "@/features/growth/components/para/UnsubscribeConfirm";

import { growthDb } from "@/features/growth/services/growthDb";
import { leadForUnsubscribe } from "@/features/growth/services/suppressionService";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Dejar de recibir mensajes · Tlaco", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function BajaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lead = await leadForUnsubscribe(growthDb(createAdminClient()), token);
  if (!lead) notFound();

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="flex min-h-16 items-center border-b border-border-soft px-5 sm:px-8">
        <TlacoLogo size="md" />
      </header>
      <section className="mx-auto grid max-w-md gap-5 px-5 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">{lead.businessName}</p>
        <h1 className="text-2xl font-bold tracking-tight">¿Dejamos de escribirte?</h1>
        <p className="text-base text-muted-foreground">Te damos de baja de correo y WhatsApp. No tienes que contestar nada más.</p>
        <UnsubscribeConfirm token={token} alreadyDone={lead.done} />
      </section>
    </main>
  );
}
