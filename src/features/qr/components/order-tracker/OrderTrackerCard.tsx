"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Clock,
  Loader2,
  PackageCheck,
  Receipt,
} from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfettiBurst } from "@/features/qr/components/ConfettiBurst";
import { getFulfillmentStatusMeta } from "@/features/qr/constants/fulfillmentStatusMeta";
import {
  formatCurrency,
  formatRelativeTime,
  groupIntoBatches,
} from "@/features/qr/helpers/format";

import type { BillDevice, BillItem } from "@/features/qr/hooks/useBillData";
import type { LucideIcon } from "lucide-react";

interface OrderTrackerCardProps {
  items: BillItem[];
  devices: BillDevice[];
  total: number;
  /** Payment lifecycle (orders.status) — "paid" completes the journey. */
  orderStatus: string;
  /**
   * Staff-controlled preparation state (orders.fulfillment_status):
   * received → in_progress → ready. Drives the journey stepper.
   */
  fulfillmentStatus: string;
  myDeviceId: string | null;
  loading?: boolean;
  /** For the inline "pagar / ver cuenta" link. */
  token: string;
  orderId: string;
}

type StepState = "done" | "active" | "pending";

// Neutral, multi-business copy — NO food/restaurant labels or icons.
const STEPS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "received", label: "Recibido", icon: Receipt },
  { key: "in_progress", label: "En proceso", icon: Clock },
  { key: "ready", label: "Listo", icon: PackageCheck },
];

function stepStates(fulfillmentStatus: string, paid: boolean): StepState[] {
  if (paid) return ["done", "done", "done"];
  if (fulfillmentStatus === "ready") return ["done", "done", "done"];
  if (fulfillmentStatus === "in_progress")
    return ["done", "active", "pending"];
  // received: the business got the order but hasn't started yet.
  return ["done", "pending", "pending"];
}

function statusMessage(
  fulfillmentStatus: string,
  paid: boolean,
  readyCount: number,
  totalCount: number,
  hasNewArrival: boolean,
): string {
  if (paid) return "Cuenta pagada. ¡Gracias!";
  if (fulfillmentStatus === "ready")
    return "¡Listo! Ya puedes pagar tu cuenta.";
  if (readyCount > 0 && readyCount < totalCount) {
    const base = `${readyCount} de ${totalCount} productos ya están listos.`;
    // Only call out a fresh addition — repeating every state as three
    // numbers reads as noise, one extra word doesn't.
    return hasNewArrival ? `${base} Se agregó algo nuevo.` : base;
  }
  if (fulfillmentStatus === "in_progress")
    return "El negocio está preparando tu pedido.";
  return "El negocio ya recibió tu pedido.";
}

/**
 * Journey card on the mesa screen: once the customer sends items they SEE their
 * order without opening the bill — what was ordered, by whom, the running total,
 * and where it is in its journey (recibido → en proceso → listo).
 *
 * Items are grouped into "tandas" (rounds) by time so a growing order — a second
 * round, or another person joining — reads as a timeline instead of one flat
 * list (the Uber/Rappi pattern). Neutral copy: the QR is multi-business.
 */
export function OrderTrackerCard({
  items,
  devices,
  total,
  orderStatus,
  fulfillmentStatus,
  myDeviceId,
  loading = false,
  token,
  orderId,
}: OrderTrackerCardProps) {
  // Collapsed by default: the stepper + total (the glanceable part) stay
  // visible, and the item detail expands on demand — giving the menu below
  // more room without hiding the customer's status.
  const [showDetails, setShowDetails] = useState(false);

  const paid = orderStatus === "paid";

  // Some lines can be ready while others aren't (a drink comes out before a
  // service). The 3-step stepper stays order-level, but this highlights
  // partial progress right on the "En proceso" step — visible without
  // expanding the item detail or opening the bill.
  const readyItemCount = items.filter(
    (i) => i.fulfillment_status === "ready",
  ).length;
  const receivedItemCount = items.filter(
    (i) => (i.fulfillment_status ?? "received") === "received",
  ).length;
  const inProgressItemCount = items.length - readyItemCount - receivedItemCount;
  const hasNewArrival =
    !paid && readyItemCount > 0 && receivedItemCount > 0;
  const hasPartialProgress =
    !paid && readyItemCount > 0 && readyItemCount < items.length;

  // Momentary "just delivered" flash (Uber/Didi style) — fires ONCE right
  // when a line flips to ready, then settles into the plain badge state.
  // Distinct from a persistent ping: it's a one-shot confirmation, not an
  // ongoing attention call. Hooks must run unconditionally, so this sits
  // above the items.length early-return below.
  const [justCompletedPulse, setJustCompletedPulse] = useState(false);
  const prevReadyCountRef = useRef(readyItemCount);
  useEffect(() => {
    if (readyItemCount > prevReadyCountRef.current) {
      setJustCompletedPulse(true);
      const timer = setTimeout(() => setJustCompletedPulse(false), 1200);
      prevReadyCountRef.current = readyItemCount;
      return () => clearTimeout(timer);
    }
    prevReadyCountRef.current = readyItemCount;
  }, [readyItemCount]);

  // Same one-shot flash, but for a line STARTING preparation (received ->
  // in_progress) — otherwise the customer has no glanceable cue that staff
  // began working on their order until they expand the item list.
  const [justStartedPulse, setJustStartedPulse] = useState(false);
  const prevInProgressCountRef = useRef(inProgressItemCount);
  useEffect(() => {
    if (inProgressItemCount > prevInProgressCountRef.current) {
      setJustStartedPulse(true);
      const timer = setTimeout(() => setJustStartedPulse(false), 1200);
      prevInProgressCountRef.current = inProgressItemCount;
      return () => clearTimeout(timer);
    }
    prevInProgressCountRef.current = inProgressItemCount;
  }, [inProgressItemCount]);

  if (items.length === 0) return null;

  const isReady = paid || fulfillmentStatus === "ready";
  const states = stepStates(fulfillmentStatus, paid);
  const deviceById = new Map(devices.map((d) => [d.id, d] as const));
  const batches = groupIntoBatches(items);
  const multipleBatches = batches.length > 1;
  const nowMs = Date.now();

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      {/* Header — tap to collapse/expand the item detail. The stepper + total
          stay visible so the customer always sees status at a glance. */}
      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="flex w-full items-baseline justify-between gap-2 text-left"
        aria-expanded={showDetails}
      >
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Tu pedido
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${
              showDetails ? "rotate-180" : ""
            }`}
          />
        </span>
        <span className="text-lg font-bold tracking-tight text-foreground">
          {formatCurrency(total)}
        </span>
      </button>

      {/* Journey stepper */}
      <div className="mt-3 flex items-center">
        {STEPS.map((step, i) => {
          const state = states[i];
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className={`flex items-center ${i > 0 ? "flex-1" : ""}`}
            >
              {i > 0 && (
                <span
                  aria-hidden
                  className={`mx-1.5 h-0.5 flex-1 rounded-full ${
                    state === "pending" ? "bg-border" : "bg-accent"
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                    state === "done"
                      ? "bg-accent text-accent-foreground"
                      : state === "active"
                        ? "bg-accent/15 text-accent"
                        : "bg-border-soft/60 text-muted-foreground"
                  }`}
                >
                  {state === "active" && (
                    <span
                      aria-hidden
                      className={`absolute inset-0 rounded-full ${
                        justStartedPulse
                          ? "animate-ping bg-amber-400/50"
                          : "animate-ping bg-accent/20"
                      }`}
                    />
                  )}
                  {state === "done" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon
                      className={`relative h-4 w-4 transition-transform duration-300 ${
                        state === "active" && justStartedPulse ? "scale-125" : ""
                      }`}
                    />
                  )}
                  {/* Partial progress marker: at least one line is ready
                      while the order overall is still "en proceso" — a
                      glanceable cue without opening the detail. Pulses ONCE
                      right when a line just flipped to ready (Uber/Didi-style
                      delivery confirmation), then settles into a plain dot. */}
                  {step.key === "in_progress" && hasPartialProgress && (
                    <span
                      aria-hidden
                      className={`absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-surface transition-transform duration-300 ${
                        justCompletedPulse ? "scale-125" : "scale-100"
                      }`}
                    >
                      {justCompletedPulse && (
                        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />
                      )}
                      <Check className="relative h-2 w-2 text-white" strokeWidth={3} />
                    </span>
                  )}
                  {/* Confetti accent — mounted only during the one-shot flash,
                      unmounts right after so it never lingers or re-fires. */}
                  {step.key === "in_progress" && justCompletedPulse && (
                    <ConfettiBurst />
                  )}
                </span>
                <span
                  className={`whitespace-nowrap text-[10px] font-bold ${
                    state === "pending"
                      ? "text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status line — reflects the staff-controlled preparation state */}
      <p
        className={`mt-3 text-center text-xs font-semibold transition-colors duration-300 ${
          isReady || hasPartialProgress ? "text-accent" : "text-muted-foreground"
        }`}
      >
        {statusMessage(
          fulfillmentStatus,
          paid,
          readyItemCount,
          items.length,
          hasNewArrival,
        )}
      </p>

      {/* Sent items — grouped into rounds (tandas); collapsible. */}
      {showDetails && (
      <div className="mt-4 space-y-3 border-t border-border-soft pt-3">
        {batches.map((batch, bi) => (
          <div key={batch.at ?? bi}>
            {multipleBatches && (
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Tanda {bi + 1}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(batch.at, nowMs)}
                </span>
              </div>
            )}
            <ul className="space-y-2">
              {batch.items.map((item) => {
                const device = item.added_by_device_id
                  ? deviceById.get(item.added_by_device_id)
                  : undefined;
                const isMine =
                  !!item.added_by_device_id &&
                  item.added_by_device_id === myDeviceId;
                const itemMeta = getFulfillmentStatusMeta(item.fulfillment_status);
                return (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.quantity}× {item.product_name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        {device && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                              aria-hidden
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: device.color_hex }}
                            />
                            {device.display_name ?? "Cliente"}
                            {isMine && (
                              <span className="font-semibold text-accent">
                                (tú)
                              </span>
                            )}
                          </p>
                        )}
                        {!paid && (
                          <StatusBadge
                            tone={itemMeta.tone}
                            label={itemMeta.label}
                            compact
                          />
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-foreground">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      )}

      {/* Secondary shortcut to the full bill. Paying lives ONLY in the fixed
          bottom CTA — this stays a neutral link so there's a single green. */}
      {!paid && (
        <Link
          href={`/q/${token}/table/bill?order_id=${orderId}`}
          className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-border-soft/40"
        >
          <Receipt className="h-4 w-4" />
          Ver cuenta completa
        </Link>
      )}
    </section>
  );
}
