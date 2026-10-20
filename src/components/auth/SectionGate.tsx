"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldX } from "lucide-react";

import { useCanOpenSection } from "@/stores/useTenantStore";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";

import { HOME_SECTION, dashboardSectionOf, landingSection } from "@/constants/dashboardAccess";

/**
 * Same rule as the menus (`dashboardAccess`). A role that can't open the home
 * is sent straight to its work (a waiter lands on Órdenes); any other section
 * it can't open explains why instead of rendering a page full of 403s. The
 * API still authorizes on its own.
 */
export function SectionGate({
  pathname,
  tenantSlug,
  children,
}: {
  pathname: string;
  tenantSlug: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const canOpen = useCanOpenSection();
  const section = dashboardSectionOf(pathname);
  const allowed = canOpen(section);
  const landing = landingSection(canOpen);
  const landingHref = landing && landing !== HOME_SECTION
    ? `/dashboard/${tenantSlug}/${landing}`
    : `/dashboard/${tenantSlug}`;
  const redirectHome = !allowed && section === HOME_SECTION && landing !== null;

  useEffect(() => {
    if (redirectHome) router.replace(landingHref);
  }, [redirectHome, landingHref, router]);

  if (allowed) return <>{children}</>;
  if (redirectHome) return <LoadingBlock message="Abriendo tu espacio de trabajo…" />;

  return (
    <EmptyState
      icon={ShieldX}
      tone="muted"
      title="No tienes acceso a esta sección"
      description="Tu rol no incluye este permiso. Pídele a la persona propietaria que lo active desde Equipo."
      action={
        landing && (
          <Link
            href={landingHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Ir a mi trabajo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )
      }
    />
  );
}
