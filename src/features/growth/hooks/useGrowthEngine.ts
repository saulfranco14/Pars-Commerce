import { useCallback, useState } from "react";
import useSWR from "swr";

import {
  connectTelegramWebhook,
  createMailbox,
  createTelegramLink,
  engineKey,
  saveSettings,
  testMailbox,
  updateMailbox,
} from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { EngineOverview, GrowthSettingsPatch, MailboxInput } from "@/features/growth/interfaces/settings";

type Notice = { tone: "success" | "error" | "info"; message: string } | null;

export function useGrowthEngine() {
  const { data, error, isLoading, mutate } = useSWR<EngineOverview>(engineKey, swrFetcher);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [telegramCode, setTelegramCode] = useState<{ code: string; deepLink: string | null } | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  async function run<T>(key: string, action: () => Promise<T>, success: (result: T) => string): Promise<boolean> {
    setBusy(key);
    try {
      const result = await action();
      setNotice({ tone: "success", message: success(result) });
      await mutate();
      return true;
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "No pudimos guardar el cambio." });
      return false;
    } finally {
      setBusy(null);
    }
  }

  return {
    overview: data,
    error,
    isLoading,
    busy,
    notice,
    clearNotice,
    telegramCode,
    saveSettings: (patch: GrowthSettingsPatch) => run("settings", () => saveSettings(patch), () => "Ajustes guardados."),
    togglePause: (paused: boolean) => run("pause", () => saveSettings({ paused }), () => (paused ? "Motor pausado." : "Motor reanudado.")),
    addMailbox: (input: MailboxInput) => run("mailbox", () => createMailbox(input), () => "Buzón agregado. Pruébalo antes de activarlo."),
    toggleMailbox: (id: string, isActive: boolean) => run(`toggle-${id}`, () => updateMailbox(id, { is_active: isActive }), () => (isActive ? "Buzón activo." : "Buzón pausado.")),
    testMailbox: (id: string) =>
      run(`test-${id}`, () => testMailbox(id), (result) =>
        result.smtp === "ok" && result.imap === "ok" ? "Conexión correcta: te mandamos un correo de prueba a ese buzón." : [result.smtp, result.imap].filter((line) => line !== "ok").join(" ")),
    linkTelegram: () =>
      run("telegram", async () => {
        const result = await createTelegramLink();
        setTelegramCode(result);
        return result;
      }, () => "Código listo. Vence en 15 minutos."),
    connectWebhook: () => run("webhook", () => connectTelegramWebhook(), (result) => `Bot conectado a ${result.url}`),
  };
}
