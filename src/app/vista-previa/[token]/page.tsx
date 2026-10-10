import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock3, Eye, LockKeyhole, Package } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { hashPreviewToken } from "@/features/preview/previewLinks";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Vista previa privada · Tlaco", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PrivatePreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  if (token.length < 32) notFound();
  const admin = createAdminClient();
  const { data: link } = await admin.from("tenant_preview_links" as never).select("id, tenant_id, expires_at, revoked_at").eq("token_hash", hashPreviewToken(token)).maybeSingle() as unknown as { data: { id: string; tenant_id: string; expires_at: string; revoked_at: string | null } | null };
  if (!link || link.revoked_at || new Date(link.expires_at).getTime() <= Date.now()) notFound();
  const [{ data: tenant }, { data: products }] = await Promise.all([
    admin.from("tenants").select("id, name, description, theme_color, slug").eq("id", link.tenant_id).single(),
    admin.from("products").select("id, name, description, price, image_url, type").eq("tenant_id", link.tenant_id).is("deleted_at", null).order("name").limit(80),
  ]);
  if (!tenant) notFound();
  await admin.from("tenant_preview_links" as never).update({ last_viewed_at: new Date().toISOString() } as never).eq("id", link.id);
  const accent = tenant.theme_color?.trim() || "#3483fa";
  const expires = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(link.expires_at));
  return (
    <main className="min-h-dvh bg-slate-50 text-slate-950">
      <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-950"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" /> Vista previa privada y de sólo lectura · vence {expires}</div>
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><TlacoLogo size="sm" /><span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"><Eye className="h-3.5 w-3.5" /> No recibe pedidos</span></div></header>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>Catálogo preparado para revisión</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{tenant.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{tenant.description || "Revisa productos, servicios e importes antes de aprobar la publicación."}</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"><Clock3 className="h-4 w-4" /> Los precios son una propuesta y todavía pueden editarse.</div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(products ?? []).map((product) => (
            <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-square bg-slate-100">{product.image_url ? <Image src={product.image_url} alt={product.name} fill unoptimized sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" /> : <Package className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-slate-300" />}</div>
              <div className="p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{product.type === "service" ? "Servicio" : "Producto"}</p><h2 className="mt-1 line-clamp-2 text-sm font-bold">{product.name}</h2><p className="mt-3 font-black tabular-nums" style={{ color: accent }}>${Number(product.price).toLocaleString("es-MX")}</p></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
