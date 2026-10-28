"use client";

import { useState } from "react";

import { Notification } from "@/components/ui/Notification";

import { confirmUnsubscribe } from "@/features/growth/services/growthClient";

export function UnsubscribeConfirm({ token, alreadyDone }: { token: string; alreadyDone: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(alreadyDone ? "done" : "idle");

  if (state === "done") {
    return <Notification tone="success" message="Listo. No te volveremos a escribir por ningún medio." />;
  }

  return (
    <div className="grid gap-3">
      {state === "error" ? <Notification tone="error" message="No pudimos procesarlo. Intenta de nuevo en un momento." /> : null}
      <button
        type="button"
        disabled={state === "sending"}
        onClick={async () => {
          setState("sending");
          try {
            await confirmUnsubscribe(token);
            setState("done");
          } catch {
            setState("error");
          }
        }}
        className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-accent px-6 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition active:scale-[0.99] disabled:opacity-60"
      >
        {state === "sending" ? "Procesando…" : "Sí, ya no quiero recibir mensajes"}
      </button>
    </div>
  );
}
