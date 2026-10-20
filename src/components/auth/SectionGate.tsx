"use client";

import Link from "next/link";
import { ArrowLeft, ShieldX } from "lucide-react";

import { useCanOpenSection } from "@/stores/useTenantStore";
import { EmptyState } from "@/components/admin/EmptyState";

import { dashboardSectionOf } from "@/constants/dashboardAccess";

/**
 * Typing a URL the role can't open shows why, instead of a half-rendered page
 * full of 403s. Same rule as the menus; the API still authorizes on its own.
 */
export function SectionGate({
  pathname,
  homeHref,
  children,
}: {
  pathname: string;
  homeHref: string;
  children: React.ReactNode;
}) {
  const canOpen = useCanOpenSection();
  if (canOpen(dashboardSectionOf(pathname))) return <>{children}</>;

  return (
    <EmptyState
      icon={ShieldX}
      tone="muted"
      title="No tienes acceso a esta sección"
      description="Tu rol no incluye este permiso. Pídele a la persona propietaria que lo active desde Equipo."
      action={
        <Link
          href={homeHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al inicio
        </Link>
      }
    />
  );
}
