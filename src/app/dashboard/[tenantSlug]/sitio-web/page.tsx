"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteWebConfigSection } from "./SiteWebConfigSection";

export default function SitioWebPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  return (
    <div className="mx-auto flex min-h-0 max-w-4xl flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border pb-4">
        <Link
          href={`/dashboard`}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Volver al inicio
        </Link>
        <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Sitio web
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Redes sociales, WhatsApp y contenido de tu sitio público.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm p-4 sm:p-6 md:p-8">
        <SiteWebConfigSection tenantSlug={tenantSlug} />
      </div>
    </div>
  );
}
