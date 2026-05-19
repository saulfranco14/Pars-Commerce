"use client";

import { Notification } from "@/components/ui/Notification";
import { DeviceNamePrompt } from "@/features/qr/components/DeviceNamePrompt";
import { TableCtaBar } from "@/features/qr/components/TableCtaBar";
import { TableHeader } from "@/features/qr/components/TableHeader";
import { TableMenuGrid } from "@/features/qr/components/TableMenuGrid";
import { useDeviceNaming } from "@/features/qr/hooks/useDeviceNaming";
import { useTableCart } from "@/features/qr/hooks/useTableCart";

import type {
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
  fingerprint: string;
  initialDeviceName: string | null;
}

export function TableQRClient({
  token,
  tenant,
  qrCode,
  order,
  menu,
  fingerprint,
  initialDeviceName,
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

  if (!naming.deviceName) {
    return (
      <DeviceNamePrompt
        tenantName={tenant.name}
        tableLabel={qrCode.label}
        onConfirm={naming.confirm}
        submitting={naming.submitting}
        error={naming.error}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-36 pt-5">
      <TableHeader
        tenantName={tenant.name}
        tableLabel={qrCode.label}
        deviceName={naming.deviceName}
      />

      {cart.confirmation && (
        <Notification
          tone="success"
          message="¡Pedido enviado! Sigue agregando o pasa a la cuenta."
          onDismiss={cart.dismissConfirmation}
          className="mb-4"
        />
      )}

      {cart.error && (
        <Notification tone="error" message={cart.error} className="mb-4" />
      )}

      <section>
        <h2 className="mb-3 text-base font-bold text-foreground">
          Productos disponibles
        </h2>
        <TableMenuGrid
          products={menu}
          onAdd={cart.add}
          quantities={cart.quantitiesByProduct}
          onDecrement={cart.decrement}
        />
      </section>

      <TableCtaBar
        token={token}
        orderId={order?.id ?? null}
        entries={cart.entries}
        total={cart.total}
        itemCount={cart.itemCount}
        saving={cart.saving}
        onSend={cart.send}
        onDecrement={cart.decrement}
      />
    </main>
  );
}
