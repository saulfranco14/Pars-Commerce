"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";

import { BillSummary } from "@/features/qr/components/BillSummary";
import { SplitItemsAssigner } from "@/features/qr/components/SplitItemsAssigner";
import { SplitModePicker } from "@/features/qr/components/SplitModePicker";
import { useSplitBill } from "@/features/qr/hooks/useSplitBill";
import { swrFetcher } from "@/lib/swrFetcher";
import type { SplitGroup } from "@/features/qr/interfaces/splitBill";

interface BillResponse {
  order: {
    id: string;
    status: string;
    total: number;
    paid_total: number;
    balance_due: number;
  };
  groups: SplitGroup[];
}

export default function TableBillPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const orderId = searchParams.get("order_id");
  const key = orderId
    ? `/api/qr/table/${encodeURIComponent(orderId)}/bill`
    : null;
  const { data, isLoading, error } = useSWR<BillResponse>(key, swrFetcher);
  const { mode, setMode, peopleCount, setPeopleCount } = useSplitBill();
  const splitEnabled = searchParams.get("split") === "1";

  const groups = useMemo(() => data?.groups ?? [], [data?.groups]);

  if (!orderId) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Falta order_id en la URL.
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-semibold text-foreground">Cuenta de la mesa</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando cuenta...</p>
      ) : error || !data ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          No se pudo cargar la cuenta.
        </p>
      ) : (
        <>
          <BillSummary total={data.order.total} groups={groups} />
          {splitEnabled && (
            <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-foreground">Dividir cuenta</h2>
              <SplitModePicker mode={mode} onChange={setMode} />
              {mode === "equal" && (
                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">Personas</span>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-border px-3 py-2"
                  />
                </label>
              )}
              {mode === "items" && <SplitItemsAssigner items={[]} />}
              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/qr/table/${encodeURIComponent(orderId)}/split`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      mode,
                      people_count: mode === "equal" ? peopleCount : undefined,
                    }),
                  });
                  window.location.reload();
                }}
                className="min-h-[44px] w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
              >
                Confirmar división
              </button>
            </section>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              href={`/q/${token}`}
              className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-center text-sm"
            >
              Agregar más productos
            </Link>
            <Link
              href={`/q/${token}/table/bill?order_id=${orderId}&split=1`}
              className="min-h-[44px] rounded-lg bg-accent px-4 py-2 text-center text-sm font-medium text-accent-foreground"
            >
              Dividir cuenta
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
