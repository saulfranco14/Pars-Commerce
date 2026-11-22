"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WandSparkles } from "lucide-react";
import { useActiveTenant, usePermission } from "@/stores/useTenantStore";
import {
  adminActionButtonSecondary,
  pageSecondaryAction,
} from "@/components/admin/actionButtonClasses";
import { studioHref } from "../helpers/access";
import { studioBusinessVisible } from "../helpers/visibility";
import type { StudioSourceType } from "../interfaces/studio";

export function StudioActionLink({
  source,
  id,
  label = "Crear anuncio",
  destination,
  quick = false,
  wide = false,
}: {
  source?: StudioSourceType;
  id?: string;
  label?: string;
  destination?: "publicaciones";
  quick?: boolean;
  /** Page-level entry point: full width on phones like every other page action. */
  wide?: boolean;
}) {
  const tenant = useActiveTenant(),
    params = useParams(),
    can = usePermission();
  const slug =
    typeof params?.tenantSlug === "string" ? params.tenantSlug : tenant?.slug;
  if (!slug || !can("studio.read") || !studioBusinessVisible(tenant?.id))
    return null;
  const base = studioHref(slug, source, id),
    href = destination
      ? `${base}/${destination}`
      : quick
        ? `${base}&quick=1`
        : base;
  return (
    <Link href={href} className={wide ? pageSecondaryAction : adminActionButtonSecondary}>
      <WandSparkles className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
