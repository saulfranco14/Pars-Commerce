"use client";
import { useEffect, useRef, useState } from "react";
import {
  cancelMembership,
  changeMembership,
  checkoutMembership,
  checkoutPack,
  verifyPacks,
} from "../services/studioClientService";
import { trackStudioEvent } from "../services/studioAnalyticsClient";
import { useStudioContext } from "../components/StudioProvider";

export function useStudioBilling() {
  const { tenantId, summary, refresh } = useStudioContext();
  const running = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [message, setMessage] = useState<string | null>(null),
    verified = useRef(false);
  useEffect(() => {
    if (verified.current) return;
    if (
      new URLSearchParams(window.location.search).get("payment") !== "pending"
    )
      return;
    verified.current = true;
    void verifyPacks(tenantId)
      .then(async ({ credited }) => {
        await refresh();
        setMessage(
          credited
            ? "Tu recarga quedó acreditada. Ya puedes usar tus Tlacos."
            : "Estamos verificando tu pago. Tus Tlacos aparecerán en cuanto Mercado Pago lo apruebe.",
        );
      })
      .catch(() => {});
  }, [tenantId, refresh]);
  async function run(action: () => Promise<unknown>) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos completar la acción.",
      );
      await refresh().catch(() => {});
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return {
    busy,
    error,
    message,
    subscribe: (code: string) =>
      run(async () => {
        const result = await checkoutMembership(
          tenantId,
          code,
          summary?.plans.find((p) => p.code === code)?.catalog_version ?? 0,
        );
        trackStudioEvent("studio_membership_started", { plan: code });
        window.location.assign(result.url);
      }),
    pack: (code: string) =>
      run(async () => {
        const result = await checkoutPack(
          tenantId,
          code,
          summary?.packs.find((p) => p.code === code)?.catalog_version ?? 0,
        );
        window.location.assign(result.url);
      }),
    cancel: () =>
      run(async () => {
        await cancelMembership(tenantId);
        setMessage(
          "La renovación se detuvo. Conservas el acceso hasta terminar el periodo pagado.",
        );
      }),
    change: (code: string) =>
      run(async () => {
        await changeMembership(
          tenantId,
          code,
          summary?.plans.find((p) => p.code === code)?.catalog_version ?? 0,
        );
        setMessage(
          "El cambio se aplicará en la siguiente renovación, sin cargos ni Tlacos adicionales hoy.",
        );
      }),
  };
}
