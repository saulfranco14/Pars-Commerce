import { apiFetch } from "@/services/apiFetch";

import { MINI_APP_API, MINI_APP_INIT_HEADER } from "@/features/growth/constants/miniApp";

import type { MiniAppOutcome, MiniAppQueue, MiniAppRecentLead, MiniAppStats, MiniAppStop, ReplySuggestion } from "@/features/growth/interfaces/miniApp";

/** Every call signs with Telegram's initData; there is no cookie session inside Telegram. */
function call(initData: string, path: string, init?: RequestInit) {
  return apiFetch(`${MINI_APP_API}${path}`, { ...init, headers: { [MINI_APP_INIT_HEADER]: initData, ...init?.headers } });
}

export const miniAppClient = (initData: string) => ({
  queue: () => call(initData, "/queue") as Promise<MiniAppQueue>,
  reserve: (zone: string | null, giro: string | null) => call(initData, "/queue", { method: "POST", body: JSON.stringify({ zone, giro }) }) as Promise<MiniAppQueue>,
  outcome: (leadId: string, outcome: MiniAppOutcome) => call(initData, "/outcome", { method: "POST", body: JSON.stringify({ leadId, outcome }) }),
  nextBackground: (leadId: string) => call(initData, "/background", { method: "POST", body: JSON.stringify({ leadId }) }),
  recent: () => call(initData, "/reply") as Promise<MiniAppRecentLead[]>,
  reply: (leadId: string, text: string) => call(initData, "/reply", { method: "POST", body: JSON.stringify({ leadId, text }) }) as Promise<ReplySuggestion>,
  route: (lat: number, lng: number) => call(initData, `/ruta?lat=${lat}&lng=${lng}`) as Promise<MiniAppStop[]>,
  stats: () => call(initData, "/stats") as Promise<MiniAppStats>,
});

export type MiniAppClient = ReturnType<typeof miniAppClient>;
