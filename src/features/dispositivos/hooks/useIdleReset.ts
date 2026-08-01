"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { IDLE_WARNING_SECONDS } from "@/features/dispositivos/constants/kiosk";

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "wheel",
] as const;

/**
 * Reinicia la pantalla tras un rato sin toques. En un kiosco sin nadie
 * cuidándolo, el carrito del cliente anterior queda a la vista del siguiente:
 * es la misma regla de privacidad que limpiar `device_name` en las mesas.
 *
 * `enabled` en false apaga el reloj — no tiene sentido reiniciar mientras la
 * pantalla muestra el ticket que el cliente está fotografiando.
 */
export function useIdleReset(
  totalSeconds: number,
  onReset: () => void,
  enabled = true,
): { secondsLeft: number | null; keepAlive: () => void } {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const remaining = useRef(totalSeconds);
  const resetRef = useRef(onReset);
  resetRef.current = onReset;

  const keepAlive = useCallback(() => {
    remaining.current = totalSeconds;
    setSecondsLeft(null);
  }, [totalSeconds]);

  useEffect(() => {
    if (!enabled) {
      setSecondsLeft(null);
      return;
    }

    remaining.current = totalSeconds;
    setSecondsLeft(null);

    const bump = () => {
      remaining.current = totalSeconds;
      setSecondsLeft((prev) => (prev === null ? null : null));
    };

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, bump, { passive: true });
    }

    const timer = setInterval(() => {
      remaining.current -= 1;
      if (remaining.current <= 0) {
        setSecondsLeft(null);
        resetRef.current();
        remaining.current = totalSeconds;
        return;
      }
      // El aviso solo aparece al final: mostrar la cuenta desde el principio
      // apura al cliente sin motivo.
      setSecondsLeft(
        remaining.current <= IDLE_WARNING_SECONDS ? remaining.current : null,
      );
    }, 1000);

    return () => {
      clearInterval(timer);
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, bump);
      }
    };
  }, [totalSeconds, enabled]);

  return { secondsLeft, keepAlive };
}
