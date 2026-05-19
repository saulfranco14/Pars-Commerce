"use client";

import { TableQRClient } from "./TableQRClient";
import { useTableSession } from "@/features/qr/hooks/useTableSession";

interface TableSessionProps {
  token: string;
}

/**
 * Thin wrapper that delegates session resolution to `useTableSession` and
 * renders one of three states: loading, error, or the main TableQRClient.
 */
export function TableSession({ token }: TableSessionProps) {
  const { data, fingerprint, initialDeviceName, error, isLoading } =
    useTableSession(token);

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-foreground">
            No pudimos cargar la mesa
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (isLoading || !data || !fingerprint) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
        <p className="text-sm text-muted-foreground">Cargando mesa...</p>
      </main>
    );
  }

  return (
    <TableQRClient
      token={token}
      tenant={data.tenant}
      qrCode={data.qr_code}
      order={data.order ?? null}
      menu={data.menu ?? []}
      fingerprint={fingerprint}
      initialDeviceName={initialDeviceName}
    />
  );
}
