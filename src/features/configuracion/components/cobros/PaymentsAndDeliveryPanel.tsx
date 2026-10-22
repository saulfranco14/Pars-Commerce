"use client";

import Link from "next/link";
import { Banknote, CreditCard, Landmark, MapPin, PackagePlus, Plus, Save, Truck } from "lucide-react";

import { usePaymentsAndDelivery } from "@/features/configuracion/hooks/usePaymentsAndDelivery";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { btnPrimaryFlex, btnSecondary } from "@/components/ui/buttonClasses";
import { MercadoPagoConnectionCard } from "@/features/payment-providers/components/MercadoPagoConnectionCard";
import { SettingToggleCard } from "@/features/configuracion/components/cobros/SettingToggleCard";
import { SettingField } from "@/features/configuracion/components/cobros/SettingField";
import { DeliveryAreaField } from "@/features/configuracion/components/cobros/DeliveryAreaField";
import { PickupPointCard } from "@/features/configuracion/components/cobros/PickupPointCard";
import { PickupPointForm } from "@/features/configuracion/components/cobros/PickupPointForm";

import { newPickupPoint } from "@/features/configuracion/helpers/paymentsAndDeliveryForm";

import type { PaymentsAndDeliveryPanelProps } from "@/features/configuracion/interfaces/paymentsAndDelivery";

const saveButton =
  "mx-auto flex min-h-12 w-full max-w-3xl cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90 disabled:opacity-50";

/**
 * How the business charges and hands orders over, for the whole operation:
 * counter, tables and the online store all read these same options.
 */
export function PaymentsAndDeliveryPanel({ tenantId, tenantSlug, canManagePayments, providerResult }: PaymentsAndDeliveryPanelProps) {
  const settings = usePaymentsAndDelivery(tenantId);
  const { form, update, pickup } = settings;
  const connected = Boolean(settings.saved?.onlinePaymentConnected);

  const saveBar = (
    <button type="button" onClick={() => void settings.save()} disabled={settings.saving} className={saveButton}>
      <Save className="h-4 w-4" aria-hidden />
      {settings.saving ? "Guardando…" : "Guardar cobros y entregas"}
    </button>
  );

  return (
    <section className="mx-auto max-w-3xl space-y-5 pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Cobros y entregas</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Cómo te pagan y cómo entregas. Aplica a todo tu negocio: mostrador, mesas y tu tienda en línea. Activa solo lo que ya puedes atender.
        </p>
      </div>

      {providerResult === "connected" && (
        <Notification tone="success" message="Cuenta Mercado Pago conectada. Las ventas digitales de este negocio se acreditarán directamente en esa cuenta." />
      )}
      {providerResult === "error" && (
        <Notification tone="error" message="No se pudo completar la conexión con Mercado Pago. Revisa la cuenta e inténtalo de nuevo." />
      )}
      {settings.error && <Notification tone="error" message={settings.error} />}

      <MercadoPagoConnectionCard tenantId={tenantId} canManage={canManagePayments} />

      {settings.loading ? (
        <p className="py-6 text-sm text-muted-foreground">Cargando cobros y entregas…</p>
      ) : (
        <>
          <SettingToggleCard
            icon={CreditCard}
            title="Pago en línea"
            description={connected ? "Cobra con Mercado Pago desde el checkout seguro." : "Conecta Mercado Pago (arriba) antes de activarlo para tus clientes."}
            enabled={form.online_payment_enabled}
            onToggle={(checked) => update("online_payment_enabled", checked)}
          >
            <p className={`rounded-xl px-3 py-2 text-xs font-semibold ${connected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
              {connected
                ? "Mercado Pago conectado. Puedes activarlo o dejar solo transferencia y efectivo."
                : "Aún no está conectado: tus clientes no verán el pago en línea hasta que lo conectes."}
            </p>
          </SettingToggleCard>

          <SettingToggleCard
            icon={Landmark}
            title="Transferencia bancaria"
            description="El cliente recibe tus datos y sube su comprobante; lo confirmas en Caja."
            enabled={form.transfer.enabled}
            onToggle={(checked) => update("transfer", { ...form.transfer, enabled: checked })}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <SettingField label="Nombre visible" value={form.transfer.label} onChange={(label) => update("transfer", { ...form.transfer, label })} />
              <SettingField label="Banco" value={form.transfer.bank_name} placeholder="BBVA" onChange={(bank_name) => update("transfer", { ...form.transfer, bank_name })} />
              <SettingField
                label="Titular"
                value={form.transfer.account_holder}
                placeholder="Nombre o razón social"
                onChange={(account_holder) => update("transfer", { ...form.transfer, account_holder })}
              />
              <SettingField
                label="CLABE (18 dígitos)"
                value={form.transfer.clabe}
                inputMode="numeric"
                onChange={(clabe) => update("transfer", { ...form.transfer, clabe: clabe.replace(/\D/g, "").slice(0, 18) })}
              />
            </div>
          </SettingToggleCard>

          <SettingToggleCard
            icon={Truck}
            title="Entrega a domicilio"
            description="El cliente busca su dirección o la escribe a mano."
            enabled={form.delivery_enabled}
            onToggle={(checked) => update("delivery_enabled", checked)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <SettingField label="Costo de entrega" value={form.delivery_fee} inputMode="decimal" placeholder="$ 45" onChange={(fee) => update("delivery_fee", fee)} />
              <DeliveryAreaField value={form.delivery_area_label} onChange={(area) => update("delivery_area_label", area)} />
            </div>
          </SettingToggleCard>

          <SettingToggleCard
            icon={MapPin}
            title="Recolección en el negocio"
            description="Agrega una o varias sucursales; la primera es el punto principal."
            enabled={form.pickup_enabled}
            onToggle={(checked) => {
              update("pickup_enabled", checked);
              // Cash is paid when picking up: without pickup there is nowhere to pay it.
              if (!checked) update("cash_enabled", false);
            }}
          >
            <div className="space-y-3">
              {form.pickup_points.map((point, index) => (
                <PickupPointCard
                  key={point.id ?? `${point.name}-${index}`}
                  point={point}
                  isMain={index === 0}
                  globalHours={settings.saved?.businessHours ?? null}
                  onEdit={() => pickup.open(index, point)}
                  onRemove={() => pickup.remove(index)}
                />
              ))}
              <button
                type="button"
                onClick={() => pickup.open(null, newPickupPoint())}
                className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-accent/50 bg-accent/4 px-4 text-sm font-bold text-accent"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Agregar punto de recolección
              </button>
            </div>
          </SettingToggleCard>

          <SettingToggleCard
            icon={Banknote}
            title="Efectivo al recoger"
            description={form.pickup_enabled ? "El cliente paga cuando pasa por su pedido." : "Activa la recolección en el negocio para cobrar en efectivo."}
            enabled={form.cash_enabled}
            disabled={!form.pickup_enabled}
            onToggle={(checked) => update("cash_enabled", checked)}
          />

          {settings.notice && (
            <Notification
              tone="success"
              message={
                <>
                  {settings.notice}{" "}
                  <Link href={`/sitio/${tenantSlug}/inicio`} className="font-bold underline underline-offset-2">
                    Ver cómo lo verá el cliente
                  </Link>
                </>
              }
            />
          )}

          <MobileActionBar className="md:hidden">{saveBar}</MobileActionBar>
          <div className="sticky bottom-0 z-20 hidden border-t border-border bg-surface-raised/95 py-3 backdrop-blur md:block">{saveBar}</div>
        </>
      )}

      <FormSheet
        isOpen={pickup.editor !== null}
        onClose={pickup.close}
        title={pickup.editor?.index === null ? "Agregar punto de recolección" : "Editar punto de recolección"}
        description="Ubicación exacta, referencia y horario visible para el cliente."
        icon={PackagePlus}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button type="button" onClick={pickup.commit} className={`${btnPrimaryFlex} sm:flex-1`}>
              {pickup.editor?.index === null ? "Agregar punto" : "Guardar punto"}
            </button>
            <button type="button" onClick={pickup.close} className={`${btnSecondary} sm:flex-1`}>
              Cancelar
            </button>
          </div>
        }
      >
        {pickup.error ? <Notification tone="error" message={pickup.error} className="mb-3" /> : null}
        {pickup.editor ? (
          <PickupPointForm
            value={pickup.editor.value}
            globalHours={settings.saved?.businessHours ?? null}
            tab={pickup.tab}
            onTabChange={pickup.setTab}
            onChange={pickup.change}
          />
        ) : null}
      </FormSheet>
    </section>
  );
}
