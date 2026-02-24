"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteWebConfigSection } from "./SiteWebConfigSection";
import { SitePreviewPanel } from "@/features/sitio-web/components/SitePreviewPanel";

export default function SitioWebPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] overflow-x-hidden">
      <div className="mb-5 border-b border-border pb-3">
        <Link
          href="/dashboard"
          className="inline-flex min-h-[40px] items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Volver al inicio
        </Link>
        <h1 className="mt-1.5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Sitio web
        </h1>
        <p className="text-xs text-muted-foreground">
          Configura la apariencia, plantilla y contenido de tu sitio público.
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-5">
        <div className="min-w-0 xl:flex-1 xl:h-[calc(100vh-220px)] xl:flex xl:flex-col xl:overflow-hidden">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-surface-raised shadow-sm">
            <SiteWebConfigSection tenantSlug={tenantSlug} />
          </div>
        </div>

        <div className="hidden min-h-[400px] min-w-0 xl:flex-1 xl:block">
          <div className="sticky top-20 flex h-[calc(100vh-224px)] flex-col">
            <SitePreviewPanel tenantSlug={tenantSlug} />
          </div>
        </div>
      </div>
    </div>
  );
}
