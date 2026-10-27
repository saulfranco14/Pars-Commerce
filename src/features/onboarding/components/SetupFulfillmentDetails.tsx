"use client";

import { DeliveryAreaField } from "@/features/configuracion/components/cobros/DeliveryAreaField";
import { PickupAddressSearch } from "@/features/configuracion/components/cobros/PickupPointForm";
import { SettingField } from "@/features/configuracion/components/cobros/SettingField";

import { needsPickupAddress } from "@/features/onboarding/helpers/setupCheckoutValidation";

import type { SetupFulfillmentDetailsProps } from "@/features/onboarding/interfaces/setupCheckout";

const PANEL = "store-step-forward mt-4 space-y-4 rounded-2xl border border-border bg-[#f8f9fb] p-4";

/** The one detail each delivery choice needs before the storefront can offer it. */
export function SetupFulfillmentDetails({
  fulfillment,
  pickupPoint,
  delivery,
  onPickupPointChange,
  onDeliveryChange,
}: SetupFulfillmentDetailsProps) {
  if (needsPickupAddress(fulfillment)) {
    return (
      <div key="pickup" className={PANEL}>
        <div>
          <p className="text-sm font-semibold text-foreground">¿Dónde te encuentran tus clientes?</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Se muestra en tu tienda para que sepan a dónde ir. Puedes agregar más puntos después.
          </p>
        </div>
        <PickupAddressSearch value={pickupPoint} onChange={onPickupPointChange} />
        <SettingField
          label="Referencia (opcional)"
          value={pickupPoint.reference ?? ""}
          placeholder="Junto a la farmacia, portón azul"
          onChange={(reference) => onPickupPointChange({ ...pickupPoint, reference })}
        />
      </div>
    );
  }

  return (
    <div key="delivery" className={PANEL}>
      <div>
        <p className="text-sm font-semibold text-foreground">¿A dónde entregas?</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Tus clientes verán la zona y el costo antes de pedir.
        </p>
      </div>
      <DeliveryAreaField value={delivery.area} onChange={(area) => onDeliveryChange({ ...delivery, area })} />
      <SettingField
        label="Costo de envío (deja vacío si es gratis)"
        value={delivery.fee}
        inputMode="decimal"
        placeholder="0"
        onChange={(fee) => onDeliveryChange({ ...delivery, fee: fee.replace(/[^\d.]/g, "") })}
      />
    </div>
  );
}
