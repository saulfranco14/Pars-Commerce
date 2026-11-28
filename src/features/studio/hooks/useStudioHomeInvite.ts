"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useActiveTenant, usePermission } from "@/stores/useTenantStore";
import { loadStudioSummary } from "../services/studioClientService";
import { studioBusinessVisible } from "../helpers/visibility";
import { STUDIO_GIFT_TLACOS, STUDIO_HOME_CARD_KEY } from "../constants/studio";
import type { StudioHomeInvite } from "../interfaces/ui";

const CLOSED_EVENT = "tlaco:studio-home-closed";

function readClosed() {
  try {
    return Boolean(localStorage.getItem(STUDIO_HOME_CARD_KEY));
  } catch {
    return true;
  }
}

/** Shared by the home banner and the header link so only one of them shows; the banner stays until closed. */
export function useStudioHomeInvite(): StudioHomeInvite {
  const tenant = useActiveTenant(),
    can = usePermission(),
    [closed, setClosed] = useState(true),
    visible = Boolean(
      tenant && can("studio.create") && studioBusinessVisible(tenant.id),
    );
  useEffect(() => {
    const read = () => setClosed(readClosed());
    read();
    window.addEventListener(CLOSED_EVENT, read);
    return () => window.removeEventListener(CLOSED_EVENT, read);
  }, []);
  const summary = useSWR(
    visible && !closed ? ["studio-home-card", tenant!.id] : null,
    () => loadStudioSummary(tenant!.id),
    { revalidateOnFocus: false },
  );
  const close = () => {
    try {
      localStorage.setItem(STUDIO_HOME_CARD_KEY, "1");
    } catch {
      /* storage blocked */
    }
    window.dispatchEvent(new Event(CLOSED_EVENT));
  };
  return {
    show: visible && !closed && Boolean(summary.data),
    first: summary.data?.counts.designs === 0,
    tlacos: summary.data?.balance.available ?? STUDIO_GIFT_TLACOS,
    href: tenant ? `/dashboard/${tenant.slug}/studio` : "",
    close,
  };
}
