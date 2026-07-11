"use client";

import { CheckCircle2, Users } from "lucide-react";

import { TableQRClient } from "./TableQRClient";
import { Notification } from "@/components/ui/Notification";
import { TableScreenSkeleton } from "@/features/qr/components/TableScreenSkeleton";
import { useTableSession } from "@/features/qr/hooks/useTableSession";

interface TableSessionProps {
  token: string;
}

/**
 * Thin wrapper that delegates session resolution to `useTableSession` and
 * renders one of four states: loading, error, session-ended, or the main
 * TableQRClient.
 */
export function TableSession({ token }: TableSessionProps) {
  const {
    data,
    fingerprint,
    initialDeviceName,
    error,
    isLoading,
    ended,
    refresh,
  } = useTableSession(token);

  // The order was paid or closed by the business while this screen was open.
  // Don't silently open a fresh order — tell the customer and let THEM start
  // a new session if they actually want one.
  if (ended) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Esta cuenta se cerró
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            El negocio cerró la mesa o la cuenta ya fue pagada. ¡Gracias por tu
            visita!
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="flex min-h-[52px] w-full max-w-xs cursor-pointer items-center justify-center rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99]"
        >
          Comenzar un pedido nuevo
        </button>
      </main>
    );
  }

  if (error) {
    // A "table full" 409 comes back as a human message — surface it as a
    // friendly blocking card. Any other error uses the same shell.
    const isFull = /llena/i.test(error);
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Users className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-foreground">
            {isFull ? "Mesa llena" : "No pudimos cargar la mesa"}
          </h1>
          <div className="mt-3 text-left">
            <Notification tone={isFull ? "warning" : "error"} message={error} />
          </div>
        </div>
      </main>
    );
  }

  // Skeleton screen (not a spinner): mirrors the real layout so the loaded
  // content replaces it in place — no jump, better perceived performance.
  if (isLoading || !data || !fingerprint) {
    return <TableScreenSkeleton />;
  }

  return (
    <TableQRClient
      token={token}
      tenant={data.tenant}
      qrCode={data.qr_code}
      order={data.order ?? null}
      menu={data.menu ?? []}
      categories={data.categories ?? []}
      fingerprint={fingerprint}
      initialDeviceName={initialDeviceName}
      isOwner={data.my_device?.is_owner === true}
      incomingMerge={data.incoming_merge_request ?? null}
      outgoingMerge={data.outgoing_merge_request ?? null}
      onSessionRefresh={refresh}
    />
  );
}
