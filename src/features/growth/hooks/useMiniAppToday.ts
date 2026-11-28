"use client";

import { useState } from "react";
import useSWR from "swr";

import { AD_KINDS } from "@/features/growth/constants/prospectAds";
import { fetchAdFiles, shareFiles } from "@/features/growth/helpers/adFiles";
import { paraAdImageUrl } from "@/features/growth/services/adsClient";

import type { MiniAppClient } from "@/features/growth/services/miniAppClient";
import type { MiniAppOutcome, MiniAppQueue } from "@/features/growth/interfaces/miniApp";

type Notice = { tone: "success" | "info" | "error"; message: string } | null;

/** «Hoy»: reserved cards, ten more by zone and giro, and the two taps that send each one. */
export function useMiniAppToday(client: MiniAppClient, native: { openExternal: (url: string) => void; download: (url: string, name: string) => boolean }) {
  const { data, error, isLoading, mutate } = useSWR<MiniAppQueue>("tg-queue", () => client.queue(), { revalidateOnFocus: false });
  const [busy, setBusy] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<Notice>(null);

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo." });
    } finally {
      setBusy(null);
    }
  }

  const reserve = (zone: string | null, giro: string | null) =>
    run("reserve", async () => {
      const queue = await client.reserve(zone, giro);
      await mutate(queue, { revalidate: false });
      if (!queue.cards.length) setNotice({ tone: "info", message: "Ya no quedan negocios con WhatsApp en ese filtro. Prueba otro giro o municipio." });
    });

  const mark = (leadId: string, outcome: MiniAppOutcome) =>
    run(`${outcome}:${leadId}`, async () => {
      await client.outcome(leadId, outcome);
      await mutate((queue) => (queue ? { ...queue, cards: queue.cards.filter((card) => card.leadId !== leadId) } : queue), { revalidate: false });
    });

  const nextBackground = (leadId: string) =>
    run(`next:${leadId}`, async () => {
      await client.nextBackground(leadId);
      setVersions((current) => ({ ...current, [leadId]: (current[leadId] ?? 0) + 1 }));
    });

  /** Share sheet when the WebView has it; else Telegram's own download; else the page in the browser. */
  const shareImages = (token: string) =>
    run(`share:${token}`, async () => {
      const files = await fetchAdFiles((kind) => paraAdImageUrl(token, kind));
      if ((await shareFiles(files)) !== "unsupported") return;
      const origin = window.location.origin;
      const saved = AD_KINDS.every((kind, index) => native.download(`${origin}${paraAdImageUrl(token, kind)}`, `anuncio-${index + 1}-${kind}.png`));
      if (saved) setNotice({ tone: "success", message: "Se guardan en tu galería. Adjúntalas en el chat de WhatsApp." });
      else native.openExternal(`${origin}/para/${encodeURIComponent(token)}`);
    });

  return {
    queue: data,
    error: error as Error | undefined,
    isLoading,
    busy,
    notice,
    clearNotice: () => setNotice(null),
    version: (leadId: string) => versions[leadId] ?? 0,
    reserve,
    mark,
    nextBackground,
    shareImages,
  };
}
