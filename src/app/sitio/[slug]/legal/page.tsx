import Link from "next/link";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { asLegalAdmin, getTenantPurchaseDocuments } from "@/features/legal/legalActivation";
import { getStoreTenant } from "@/features/sitio/services/storefrontService";

export default async function StoreLegalPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ document?: string }> }) {
  const [{ slug }, { document: selected = "terms" }] = await Promise.all([params, searchParams]);
  const tenant = await getStoreTenant(slug);
  if (!tenant) notFound();
  let documents: Awaited<ReturnType<typeof getTenantPurchaseDocuments>>;
  try { documents = await getTenantPurchaseDocuments(asLegalAdmin(createAdminClient()), tenant.id); }
  catch { notFound(); }
  const current = selected === "privacy" ? documents[1] : documents[0];
  return <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8"><Link className="text-sm font-semibold text-accent hover:underline" href={`/sitio/${slug}/carrito`}>Volver al carrito</Link><p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Información del negocio · {current.version}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{current.title}</h1><p className="mt-5 whitespace-pre-line text-base leading-7 text-muted-foreground">{current.content}</p><nav className="mt-8 flex gap-4 text-sm font-semibold"><Link className={selected !== "privacy" ? "text-accent" : "text-muted-foreground"} href={`/sitio/${slug}/legal?document=terms`}>Condiciones de compra</Link><Link className={selected === "privacy" ? "text-accent" : "text-muted-foreground"} href={`/sitio/${slug}/legal?document=privacy`}>Aviso de privacidad</Link></nav></main>;
}
