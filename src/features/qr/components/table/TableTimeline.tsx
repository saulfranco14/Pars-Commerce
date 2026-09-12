"use client";

import { Banknote, CreditCard, Plus, Users } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

interface TimelineItem {
  id: string;
  product_name: string;
  quantity: number;
  subtotal: number;
  added_by_device_id: string | null;
  created_at: string;
}

interface TimelineActivity {
  id: string;
  action: string;
  payload: Record<string, unknown> | null;
  actor_label: string | null;
  created_at: string;
}

interface TimelineDevice {
  display_name: string | null;
  color_hex: string;
}

interface TableTimelineProps {
  items: TimelineItem[];
  activityLog: TimelineActivity[];
  devices: Map<string, TimelineDevice>;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type TimelineEntry =
  | {
      kind: "item";
      id: string;
      ts: string;
      productName: string;
      quantity: number;
      subtotal: number;
      deviceName: string;
      deviceColor: string;
    }
  | {
      kind: "split";
      id: string;
      ts: string;
      mode: string;
      groups: number;
    }
  | {
      kind: "payment";
      id: string;
      ts: string;
      method: string;
      amount: number;
    };

export function TableTimeline({
  items,
  activityLog,
  devices,
}: TableTimelineProps) {
  const itemEntries: TimelineEntry[] = items.map((item) => {
    const device = item.added_by_device_id
      ? devices.get(item.added_by_device_id)
      : undefined;
    return {
      kind: "item",
      id: `item-${item.id}`,
      ts: item.created_at,
      productName: item.product_name,
      quantity: item.quantity,
      subtotal: item.subtotal,
      deviceName: device?.display_name || "Cliente",
      deviceColor: device?.color_hex || "#94a3b8",
    };
  });

  const eventEntries: TimelineEntry[] = activityLog
    .filter(
      (e) =>
        e.action === "split.created" || e.action === "payment.succeeded",
    )
    .map((e) => {
      if (e.action === "split.created") {
        return {
          kind: "split",
          id: `act-${e.id}`,
          ts: e.created_at,
          mode: String((e.payload?.mode as string) ?? ""),
          groups: Number(e.payload?.groups ?? 0),
        };
      }
      return {
        kind: "payment",
        id: `act-${e.id}`,
        ts: e.created_at,
        method: String((e.payload?.method as string) ?? ""),
        amount: Number(e.payload?.amount ?? 0),
      };
    });

  const all = [...itemEntries, ...eventEntries].sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
  );

  if (all.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        Aún no hay actividad en esta mesa.
      </p>
    );
  }

  return (
    <ol className="mt-3 space-y-2">
      {all.map((entry) => {
        if (entry.kind === "item") {
          return (
            <li
              key={entry.id}
              className="flex items-start gap-3 rounded-lg border border-border-soft px-3 py-2"
            >
              <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Plus className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {entry.quantity}× {entry.productName}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.deviceColor }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {entry.deviceName} · {formatTime(entry.ts)}
                  </span>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                {formatCurrency(entry.subtotal)}
              </span>
            </li>
          );
        }
        if (entry.kind === "split") {
          return (
            <li
              key={entry.id}
              className="flex items-start gap-3 rounded-lg border border-border-soft px-3 py-2"
            >
              <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <Users className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Se dividió la cuenta en {entry.groups} {entry.groups === 1 ? "parte" : "partes"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatTime(entry.ts)}
                </p>
              </div>
            </li>
          );
        }
        // payment
        return (
          <li
            key={entry.id}
            className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2"
          >
            <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              {entry.method === "efectivo" ? (
                <Banknote className="h-3.5 w-3.5" />
              ) : (
                <CreditCard className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                Pago recibido por {entry.method}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatTime(entry.ts)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-emerald-700">
              {formatCurrency(entry.amount)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
