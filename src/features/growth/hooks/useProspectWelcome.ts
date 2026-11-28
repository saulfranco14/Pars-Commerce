"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

import { useActiveTenant } from "@/stores/useTenantStore";

import { fetchAdFiles, saveFiles, shareFiles } from "@/features/growth/helpers/adFiles";
import { prospectAdImageUrl, prospectWelcomeKey } from "@/features/growth/services/adsClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { ProspectWelcome } from "@/features/growth/interfaces/paraAds";

type Notice = { tone: "success" | "info" | "error"; message: string } | null;

const closedKey = (tenantId: string) => `tlaco:prospect-welcome-closed:${tenantId}`;

/** The gift ads of a business that came from prospecting, clean, on its home until it closes the card. */
export function useProspectWelcome() {
  const tenant = useActiveTenant();
  const { data } = useSWR<ProspectWelcome>(tenant ? prospectWelcomeKey(tenant.id) : null, swrFetcher, { shouldRetryOnError: false, revalidateOnFocus: false });
  const [closed, setClosed] = useState(true);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    if (!tenant) return;
    try {
      setClosed(window.localStorage.getItem(closedKey(tenant.id)) === "1");
    } catch {
      setClosed(false);
    }
  }, [tenant]);

  function close() {
    setClosed(true);
    try {
      if (tenant) window.localStorage.setItem(closedKey(tenant.id), "1");
    } catch {
      // Private mode: it comes back next visit, which is fine.
    }
  }

  async function files() {
    if (!tenant) return [];
    return fetchAdFiles((kind) => prospectAdImageUrl(tenant.id, kind));
  }

  async function download() {
    setBusy("download");
    setNotice(null);
    try {
      await saveFiles(await files());
      setNotice({ tone: "success", message: "Listo, sus 4 anuncios se guardaron en su celular." });
    } catch {
      setNotice({ tone: "error", message: "No se pudieron descargar. Intente de nuevo." });
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    setBusy("share");
    setNotice(null);
    try {
      if ((await shareFiles(await files())) === "unsupported") setNotice({ tone: "info", message: "Su teléfono no deja compartir desde aquí. Descárguelos y súbalos a su Estado." });
    } catch {
      setNotice({ tone: "error", message: "No se pudieron compartir. Intente con Descargar." });
    } finally {
      setBusy(null);
    }
  }

  return {
    tenant,
    welcome: !closed && data ? data : null,
    imageUrl: (kind: ProspectWelcome["kinds"][number]) => (tenant ? prospectAdImageUrl(tenant.id, kind) : ""),
    close,
    download,
    share,
    busy,
    notice,
    clearNotice: () => setNotice(null),
  };
}
