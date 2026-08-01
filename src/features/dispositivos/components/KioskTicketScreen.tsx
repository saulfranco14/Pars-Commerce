"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Banknote, CheckCircle2, Clock, Smartphone } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";
import { formatPickupTime } from "@/features/checkout/helpers/pickupSchedule";

import type { KioskTicketScreenProps } from "@/features/dispositivos/interfaces/kioskUi";

/** Lo que ve el cliente al terminar: su número, su QR y cómo pagar. */
export function KioskTicketScreen({
  orderNumber,
  qrToken,
  total,
  scheduledFor,
  onDone,
}: KioskTicketScreenProps) {
  const payUrl = `${window.location.origin}/q/${qrToken}`;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10">
      <div className="flex w-full max-w-4xl flex-col items-center">
        <div className="flex items-center gap-3 rounded-full bg-emerald-100 px-6 py-3">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden />
          <span className="text-xl font-bold text-emerald-800">
            Pedido registrado
          </span>
        </div>

        <p className="mt-8 text-lg font-bold uppercase tracking-wider text-muted-foreground">
          Tu número
        </p>
        <p className="font-mono text-8xl font-bold leading-none tracking-widest text-accent">
          {orderNumber}
        </p>

        <p className="mt-6 text-6xl font-bold tracking-tight tabular-nums text-foreground">
          {formatCurrency(total)}
        </p>

        {scheduledFor && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-accent/10 px-6 py-3 text-xl font-semibold text-accent">
            <Clock className="h-6 w-6 shrink-0" aria-hidden />
            Pasas por él el {formatPickupTime(new Date(scheduledFor))}
          </p>
        )}

        <p className="mt-10 text-2xl font-bold text-foreground">
          Ya solo falta pagar. Elige cómo:
        </p>

        <div className="mt-6 grid w-full gap-6 md:grid-cols-2 md:items-stretch">
          <div className="flex flex-col items-center rounded-3xl border-2 border-accent bg-surface p-6">
            <div className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-accent">
              <Smartphone className="h-5 w-5 shrink-0" aria-hidden />
              Con tu celular
            </div>
            <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
              <QRCodeCanvas value={payUrl} size={220} level="M" />
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground">
              Escanea con tu cámara
            </p>
            <p className="text-base text-muted-foreground">
              Pagas ahí mismo y listo
            </p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-border bg-surface p-6">
            <div className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-muted-foreground">
              <Banknote className="h-5 w-5 shrink-0" aria-hidden />
              En efectivo
            </div>
            <p className="mt-5 text-xl text-foreground">
              Pasa al mostrador y di:
            </p>
            <p className="mt-2 font-mono text-5xl font-bold text-accent">
              {orderNumber}
            </p>
            <p className="mt-4 text-base text-muted-foreground">
              Ahí reciben tu dinero y activan tu pedido
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDone}
          className="mt-10 inline-flex min-h-20 cursor-pointer items-center justify-center rounded-2xl bg-accent px-16 text-2xl font-bold text-accent-foreground shadow-lg shadow-accent/25 transition-colors hover:bg-accent/90"
        >
          Listo, gracias
        </button>
        <p className="mt-3 text-base text-muted-foreground">
          Toma una foto de tu número antes de salir
        </p>
      </div>
    </div>
  );
}
