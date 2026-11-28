"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { WandSparkles, X } from "lucide-react";
import { useActiveTenant, usePermission } from "@/stores/useTenantStore";
import {
  adminActionButtonIcon,
  pageHeaderCta,
} from "@/components/admin/actionButtonClasses";
import { StudioActionLink } from "./StudioActionLink";
import { loadStudioSummary } from "../services/studioClientService";
import { studioBusinessVisible } from "../helpers/visibility";
import { STUDIO_GIFT_TLACOS, STUDIO_HOME_CARD_KEY } from "../constants/studio";

/**
 * On the business home: until its first ad, an invitation with the gifted
 * Tlacos; after that, or once closed, the usual link to Studio.
 */
export function StudioHomeCard() {
  const tenant = useActiveTenant(),
    can = usePermission(),
    [closed, setClosed] = useState(true),
    visible = Boolean(
      tenant && can("studio.create") && studioBusinessVisible(tenant.id),
    );
  useEffect(() => {
    try {
      setClosed(Boolean(localStorage.getItem(STUDIO_HOME_CARD_KEY)));
    } catch {
      setClosed(true);
    }
  }, []);
  const summary = useSWR(
    visible && !closed ? ["studio-home-card", tenant!.id] : null,
    () => loadStudioSummary(tenant!.id),
    { revalidateOnFocus: false },
  );
  if (!visible || closed || !summary.data || summary.data.counts.designs > 0)
    return <StudioActionLink label="Crear publicidad con Studio" wide />;

  const close = () => {
    try {
      localStorage.setItem(STUDIO_HOME_CARD_KEY, "1");
    } catch {
      /* storage blocked */
    }
    setClosed(true);
  };
  const tlacos = summary.data.balance.available ?? STUDIO_GIFT_TLACOS;
  return (
    <section
      aria-labelledby="studio-home-card"
      className="flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:flex-row sm:items-center"
    >
      <span className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <WandSparkles className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span
            id="studio-home-card"
            className="block text-sm font-bold text-foreground"
          >
            Haz tu primer anuncio
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            Tienes {tlacos} Tlacos de regalo para imágenes con IA. Diseñar y
            compartir es gratis.
          </span>
        </span>
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className={`${adminActionButtonIcon} -mt-1 -mr-1 shrink-0 sm:hidden`}
        >
          <X className="h-4 w-4" />
        </button>
      </span>
      <span className="flex items-center gap-2">
        <Link
          href={`/dashboard/${tenant!.slug}/studio`}
          className={pageHeaderCta}
        >
          <WandSparkles className="h-4 w-4" aria-hidden />
          Probar
        </Link>
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className={`${adminActionButtonIcon} hidden shrink-0 sm:inline-flex`}
        >
          <X className="h-4 w-4" />
        </button>
      </span>
    </section>
  );
}
