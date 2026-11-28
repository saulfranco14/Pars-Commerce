"use client";

import useSWR from "swr";

import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";

import type { MiniAppClient } from "@/features/growth/services/miniAppClient";
import type { MiniAppStats } from "@/features/growth/interfaces/miniApp";

/** «Números»: how today is going, the same counts as /hoy in the bot. */
export function MiniAppNumbers({ client }: { client: MiniAppClient }) {
  const { data, error, isLoading } = useSWR<MiniAppStats>("tg-stats", () => client.stats(), { refreshInterval: 60_000 });
  if (isLoading) return <LoadingBlock message="Contando…" variant="skeleton" />;
  if (error || !data) return <Notification tone="error" message="No pudimos cargar los números." />;
  const registered = data.registered.engine + data.registered.assisted + data.registered.self;
  return (
    <MetricsStrip
      metrics={[
        { label: "WhatsApp enviados", value: data.whatsappSent },
        { label: "Abrieron su página", value: data.views },
        { label: "Contestaron", value: data.replied, tone: "accent" },
        { label: "Registros", value: registered, tone: "emerald" },
        { label: "Calientes", value: data.hot, tone: "amber" },
        { label: "No les interesó", value: data.rejected },
      ]}
    />
  );
}
