"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { DeviceEnrollmentState } from "@/features/dispositivos/interfaces/enrollment";

const INSTALL_KEY = "tlaco_device_install_id";
const POLL_MS = 4000;

/** Identidad local de la pantalla: sobrevive recargas, no es una credencial. */
function readInstallId(): string {
  try {
    const existing = window.localStorage.getItem(INSTALL_KEY);
    if (existing && existing.length >= 16) return existing;
    const fresh = crypto.randomUUID().replace(/-/g, "");
    window.localStorage.setItem(INSTALL_KEY, fresh);
    return fresh;
  } catch {
    // Modo privado o almacenamiento bloqueado: la pantalla pedirá permiso otra
    // vez en cada recarga, que es molesto pero no roto.
    return crypto.randomUUID().replace(/-/g, "");
  }
}

/**
 * Anuncia la pantalla y pregunta hasta que la aprueben. Al aprobarse, el token
 * llega en cookie httpOnly y esta pantalla ya puede pedir catálogo y crear
 * pedidos.
 */
export function useDeviceEnrollment(
  tenantSlug: string,
  enrollKey: string,
): DeviceEnrollmentState {
  const [state, setState] = useState<DeviceEnrollmentState>({
    phase: "starting",
  });
  const installIdRef = useRef<string | null>(null);
  const stopped = useRef(false);

  const announce = useCallback(async () => {
    const installId = installIdRef.current;
    if (!installId || stopped.current) return;
    try {
      const res = await fetch("/api/devices/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_slug: tenantSlug,
          install_id: installId,
          enroll_key: enrollKey,
          screen_info: `${window.screen.width}×${window.screen.height}`,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setState({
          phase: "error",
          message: body.error ?? "No se pudo registrar esta pantalla",
        });
        return;
      }
      setState({ phase: "waiting", enrollCode: body.enroll_code });
    } catch {
      setState({
        phase: "error",
        message: "Sin conexión. Revisa la red de la pantalla.",
      });
    }
  }, [tenantSlug, enrollKey]);

  const poll = useCallback(async () => {
    const installId = installIdRef.current;
    if (!installId || stopped.current) return;
    try {
      const res = await fetch(
        `/api/devices/enroll?tenant_slug=${encodeURIComponent(tenantSlug)}&install_id=${encodeURIComponent(installId)}`,
      );

      // La solicitud ya no existe (la borraron desde el panel). Sin esto la
      // pantalla se quedaría mostrando un código muerto para siempre.
      if (res.status === 404) {
        await announce();
        return;
      }
      if (!res.ok) return;

      const body = await res.json();
      if (body.state === "ready") {
        stopped.current = true;
        setState({
          phase: "ready",
          deviceName: body.device_name ?? null,
          tenantName: body.tenant_name,
        });
      } else if (body.state === "rejected") {
        setState({ phase: "rejected" });
      } else if (body.state === "pending" && body.enroll_code) {
        // El código pudo cambiar si volvió a la cola tras un rechazo.
        setState({ phase: "waiting", enrollCode: body.enroll_code });
      }
    } catch {
      // Sin red: se reintenta en el siguiente ciclo.
    }
  }, [tenantSlug, announce]);

  useEffect(() => {
    stopped.current = false;
    installIdRef.current = readInstallId();

    // Se pregunta antes de anunciarse. Una pantalla ya aprobada que se recarga
    // sin la clave en la URL arrancaba con "No se pudo registrar": la clave
    // existe para crear la solicitud, no para volver a entrar. El 404 de `poll`
    // (no está registrada) es el que dispara el anuncio.
    void poll();
    const timer = setInterval(() => void poll(), POLL_MS);
    return () => {
      stopped.current = true;
      clearInterval(timer);
    };
  }, [poll]);

  return state;
}
