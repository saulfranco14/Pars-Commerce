"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Notification } from "@/components/ui/Notification";
import { Toast } from "@/components/ui/Toast";
import { CustomerScreen } from "@/features/qr/components/CustomerScreen";
import { DeviceNamePrompt } from "@/features/qr/components/DeviceNamePrompt";
import { MergeRequestBanner } from "@/features/qr/components/MergeRequestBanner";
import { OrderTrackerCard } from "@/features/qr/components/OrderTrackerCard";
import { OrderTrackerSkeleton } from "@/features/qr/components/OrderTrackerSkeleton";
import { TableCtaBar } from "@/features/qr/components/TableCtaBar";
import { TableMenuSections } from "@/features/qr/components/TableMenuSections";
import { TableMenuHero } from "@/features/qr/components/TableMenuHero";
import { useDeviceNaming } from "@/features/qr/hooks/useDeviceNaming";
import { useTableCart } from "@/features/qr/hooks/useTableCart";
import { useCustomerMerge } from "@/features/qr/hooks/useCustomerMerge";
import { useOrderTracker } from "@/features/qr/hooks/useOrderTracker";
import {
  clearReadySeen,
  hasSeenReady,
  markReadySeen,
} from "@/features/qr/helpers/deviceFingerprint";
import { getReorderProducts } from "@/features/qr/helpers/getReorderProducts";

import type { QrPromotion } from "@/features/qr/interfaces/promotion";
import type {
  QrIncomingMergeRequest,
  QrOutgoingMergeRequest,
  QrSessionCategory,
  QrSessionMenuItem,
  QrSessionOrder,
  QrSessionQrCode,
  QrSessionTenant,
} from "@/features/qr/interfaces/tableSession";

interface TableQRClientProps {
  token: string;
  tenant: QrSessionTenant;
  qrCode: Pick<QrSessionQrCode, "id" | "label">;
  order: QrSessionOrder | null;
  menu: QrSessionMenuItem[];
  categories: QrSessionCategory[];
  fingerprint: string;
  initialDeviceName: string | null;
  isOwner: boolean;
  incomingMerge: QrIncomingMergeRequest | null;
  outgoingMerge: QrOutgoingMergeRequest | null;
  promotions: QrPromotion[];
  onSessionRefresh: () => void | Promise<void>;
}

export function TableQRClient({
  token,
  tenant,
  qrCode,
  order,
  menu,
  categories,
  fingerprint,
  initialDeviceName,
  isOwner,
  incomingMerge,
  outgoingMerge,
  promotions,
  onSessionRefresh,
}: TableQRClientProps) {
  const naming = useDeviceNaming({
    qrToken: token,
    fingerprint,
    initialName: initialDeviceName,
  });

  const cart = useTableCart({
    menu,
    orderId: order?.id ?? null,
    qrToken: token,
    fingerprint,
  });

  // "Tu pedido" tracker: hydrates once when an order is already running and
  // re-reads after each send. It no longer needs its own polling loop — the
  // pulse (via useTableSession) tells us WHEN to re-read (new batch or a
  // fulfillment change), and we reload the detailed list on that signal.
  const tracker = useOrderTracker({
    orderId: order?.id ?? null,
    fingerprint,
    initialTotal: Number(order?.total ?? 0),
  });
  const { reload: reloadTracker } = tracker;
  useEffect(() => {
    if (cart.confirmation) void reloadTracker();
  }, [cart.confirmation, reloadTracker]);

  // Live preparation state comes from the pulse-fed order, not the tracker's
  // own snapshot (which only refreshes on send). Per-person: prefer THIS
  // caller's own state (my_fulfillment_status) so "ya puedes pagar" reflects
  // when MY items are ready, not the whole table. Falls back to the order
  // summary, then the tracker snapshot.
  const liveFulfillment =
    order?.my_fulfillment_status ??
    order?.fulfillment_status ??
    tracker.fulfillmentStatus;
  const liveItemCount = order?.item_count;
  const liveReadyItemCount = order?.ready_item_count;
  const liveReceivedItemCount = order?.received_item_count;

  // Does this session already have a running order? Known from `order` on the
  // FIRST render (it comes from the session resolve, not the async tracker), so
  // the menu can start collapsed immediately and never snap shut later. True
  // when the order has items already OR the tracker is still hydrating them.
  const hasExistingOrder =
    !!order &&
    (Number(order.total ?? 0) > 0 ||
      (tracker.items?.length ?? 0) > 0 ||
      (order.item_count ?? 0) > 0);

  // "Vuelve a pedir": unique products this table already ordered, newest first,
  // for the one-tap repeat rail in the collapsed menu.
  const reorderProducts = useMemo(
    () => getReorderProducts(tracker.items, menu),
    [tracker.items, menu],
  );

  // When the pulse reports a fulfillment change, a new batch of items landed,
  // OR the distribution of per-line statuses changed, re-read the tracker so
  // the per-line detail stays in sync without a full resolve. Both
  // ready_item_count AND received_item_count are tracked (not just ready):
  // a line moving received -> in_progress while ANOTHER line is already
  // in_progress changes neither the order-level summary nor ready_item_count
  // (still zero) — only received_item_count catches that specific
  // transition. Together the two counters catch any per-line change.
  const prevFulfillmentRef = useRef<string | null>(null);
  const prevItemCountRef = useRef<number | null>(null);
  const prevReadyItemCountRef = useRef<number | null>(null);
  const prevReceivedItemCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (!order?.id) return;
    const fulfillmentChanged =
      prevFulfillmentRef.current !== null &&
      prevFulfillmentRef.current !== liveFulfillment;
    const itemsChanged =
      typeof liveItemCount === "number" &&
      prevItemCountRef.current !== null &&
      prevItemCountRef.current !== liveItemCount;
    const readyItemsChanged =
      typeof liveReadyItemCount === "number" &&
      prevReadyItemCountRef.current !== null &&
      prevReadyItemCountRef.current !== liveReadyItemCount;
    const receivedItemsChanged =
      typeof liveReceivedItemCount === "number" &&
      prevReceivedItemCountRef.current !== null &&
      prevReceivedItemCountRef.current !== liveReceivedItemCount;
    if (
      fulfillmentChanged ||
      itemsChanged ||
      readyItemsChanged ||
      receivedItemsChanged
    )
      void reloadTracker();
    prevFulfillmentRef.current = liveFulfillment;
    if (typeof liveItemCount === "number")
      prevItemCountRef.current = liveItemCount;
    if (typeof liveReadyItemCount === "number")
      prevReadyItemCountRef.current = liveReadyItemCount;
    if (typeof liveReceivedItemCount === "number")
      prevReceivedItemCountRef.current = liveReceivedItemCount;
  }, [
    order?.id,
    liveFulfillment,
    liveItemCount,
    liveReadyItemCount,
    liveReceivedItemCount,
    reloadTracker,
  ]);

  // The "¡Ya puedes pagar!" moment — announce ONCE per ready-cycle.
  //
  // Persisted per order (localStorage) so re-entering the screen never
  // re-announces. The flag is cleared ONLY on a real regression: we must have
  // OBSERVED "ready" in this mount and then seen it drop to a non-ready state
  // (a new batch). The transient initial "received" on every remount — before
  // the pulse/tracker resolve the true state — never observed "ready" first,
  // so it does NOT clear the flag (that was the bug).
  const [readyToast, setReadyToast] = useState(false);
  const sawReadyRef = useRef(false);
  useEffect(() => {
    const id = order?.id;
    if (!id) return;
    if (liveFulfillment === "ready") {
      sawReadyRef.current = true;
      if (!hasSeenReady(id)) {
        markReadySeen(id);
        setReadyToast(true);
      }
    } else if (sawReadyRef.current) {
      // Genuine ready → not-ready regression (new batch) in this session.
      sawReadyRef.current = false;
      clearReadySeen(id);
    }
  }, [order?.id, liveFulfillment]);

  const [mergeToast, setMergeToast] = useState<string | null>(null);
  const merge = useCustomerMerge({
    orderId: order?.id ?? "",
    fingerprint,
    onMerged: onSessionRefresh,
  });

  async function respondMerge(
    id: string,
    decision: "approved" | "declined" | "cancelled",
  ) {
    const ok = await merge.respond(id, decision);
    if (ok) {
      setMergeToast(
        decision === "approved"
          ? "¡Mesas unidas! Ahora comparten una cuenta."
          : decision === "declined"
            ? "Rechazaste la solicitud."
            : "Solicitud cancelada.",
      );
    }
  }

  if (!naming.deviceName) {
    return (
      <DeviceNamePrompt
        tenantName={tenant.name}
        tenantLogoUrl={tenant.logo_url}
        tableLabel={qrCode.label}
        onConfirm={naming.confirm}
        submitting={naming.submitting}
        error={naming.error}
      />
    );
  }

  return (
    <CustomerScreen
      tenantName={tenant.name}
      header={
        <TableMenuHero
          tableLabel={qrCode.label}
          deviceName={naming.deviceName}
          tenantLogoUrl={tenant.logo_url}
          tenantName={tenant.name}
          cartTotal={cart.total}
          cartItemCount={cart.itemCount}
        />
      }
      footer={
        <TableCtaBar
          token={token}
          orderId={order?.id ?? null}
          entries={cart.entries}
          total={cart.total}
          itemCount={cart.itemCount}
          saving={cart.saving}
          onSend={cart.send}
          onDecrement={cart.decrement}
          orderTotal={tracker.total}
          hasSentItems={!!tracker.items && tracker.items.length > 0}
          isReady={liveFulfillment === "ready"}
        />
      }
    >
      {cart.confirmation && (
        <Toast
          tone="success"
          message="¡Pedido enviado! El negocio ya lo recibió."
          onDone={cart.dismissConfirmation}
        />
      )}

      {readyToast && (
        <Toast
          tone="success"
          message="¡Tu pedido está listo! Ya puedes pagar tu cuenta."
          onDone={() => setReadyToast(false)}
        />
      )}

      {mergeToast && (
        <Toast
          tone="success"
          message={mergeToast}
          onDone={() => setMergeToast(null)}
        />
      )}

      {cart.error && (
        <Notification tone="error" message={cart.error} className="mb-4" />
      )}

      {/* Incoming merge invite — only the table owner can decide */}
      {incomingMerge && isOwner && (
        <div className="mb-4">
          <MergeRequestBanner
            kind="incoming"
            otherLabel={incomingMerge.requester_label}
            busy={merge.merging}
            onApprove={() => respondMerge(incomingMerge.id, "approved")}
            onDecline={() => respondMerge(incomingMerge.id, "declined")}
          />
        </div>
      )}

      {/* Incoming invite but this device isn't the responsable */}
      {incomingMerge && !isOwner && (
        <Notification
          tone="info"
          title={`${incomingMerge.requester_label} quiere unirse`}
          message="Pídele al responsable de esta mesa (quien la abrió) que acepte la invitación."
          className="mb-4"
        />
      )}

      {/* Waiting on our own request */}
      {outgoingMerge && (
        <div className="mb-4">
          <MergeRequestBanner
            kind="outgoing"
            otherLabel={outgoingMerge.target_label}
            busy={merge.merging}
            onCancel={() => respondMerge(outgoingMerge.id, "cancelled")}
          />
        </div>
      )}

      {/* Journey tracker — what was already sent, by whom, and where it is.
          Skeleton while the detail loads (order already has a total but items
          haven't arrived yet) so the layout doesn't jump on return. */}
      {order && tracker.items === null && Number(order.total ?? 0) > 0 && (
        <div className="mb-4">
          <OrderTrackerSkeleton />
        </div>
      )}
      {order && tracker.items && tracker.items.length > 0 && (
        <div className="mb-4">
          <OrderTrackerCard
            items={tracker.items}
            devices={tracker.devices}
            total={tracker.total}
            orderStatus={order.status}
            fulfillmentStatus={liveFulfillment}
            myDeviceId={tracker.myDeviceId}
            loading={tracker.loading}
            token={token}
            orderId={order.id}
          />
        </div>
      )}

      <TableMenuSections
        products={menu}
        categories={categories}
        onAdd={cart.add}
        onAddMany={cart.addMany}
        onDecrement={cart.decrement}
        quantities={cart.quantitiesByProduct}
        tenantLogoUrl={tenant.logo_url}
        tenantName={tenant.name}
        // Collapse the menu whenever an order already exists — including WHILE
        // its detail is still loading (order has a total but items===null).
        // Deciding this up-front avoids the "menu expands, then snaps closed"
        // jump when the tracker resolves a beat after the menu paints.
        startCollapsed={hasExistingOrder}
        reorderProducts={reorderProducts}
        promotions={promotions}
      />
    </CustomerScreen>
  );
}
