import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { saveSetupCheckout } from "@/features/onboarding/services/setupCheckoutService";
import { getCheckoutOptions } from "@/features/sitio/services/storefrontService";
import { sql } from "@/test/integration/setup";

const TENANT = "00000000-0000-0000-0000-00000000c4e1";
const DELIVERY_TENANT = "00000000-0000-0000-0000-00000000c4e2";
const POINT = { address_text: "Callejón Rosario 4, Santa María Nativitas, Chimalhuacán", latitude: 19.41, longitude: -98.95, mapbox_feature_id: "place-1" };

async function cleanup() {
  const tenants = [TENANT, DELIVERY_TENANT];
  await sql`delete from tenant_payment_methods where tenant_id = any(${tenants})`;
  await sql`delete from tenant_pickup_points where tenant_id = any(${tenants})`;
  await sql`delete from tenant_fulfillment_settings where tenant_id = any(${tenants})`;
  await sql`delete from tenants where id = any(${tenants})`;
}

describe("setup wizard leaves a checkout that can take orders", () => {
  beforeEach(async () => {
    await cleanup();
    await sql`insert into tenants (id, name, slug) values (${TENANT}, 'Tienda Claudia', 'itest-setup-checkout'), (${DELIVERY_TENANT}, 'Entregas Neza', 'itest-setup-delivery')`;
  });
  afterEach(cleanup);

  it("turns “Recogen aquí” and “Efectivo” into a pickup point and cash in the storefront checkout", async () => {
    expect(await saveSetupCheckout(TENANT, { step: "fulfillment", fulfillment: "pickup", pickupPoint: POINT })).toEqual({ ok: true, data: null });
    expect(await saveSetupCheckout(TENANT, { step: "payment", method: "cash" })).toEqual({ ok: true, data: null });

    const options = await getCheckoutOptions({ id: TENANT, settings: {} });
    expect(options.pickupEnabled).toBe(true);
    expect(options.pickupPoints).toHaveLength(1);
    expect(options.pickupPoints[0]).toMatchObject({ name: "Tienda Claudia", address_text: POINT.address_text });
    expect(options.cashEnabled).toBe(true);
  });

  it("moves the same point when the wizard runs again instead of adding another", async () => {
    await saveSetupCheckout(TENANT, { step: "fulfillment", fulfillment: "pickup", pickupPoint: POINT });
    await saveSetupCheckout(TENANT, { step: "fulfillment", fulfillment: "onsite", pickupPoint: { address_text: "Av. Chimalhuacán 120" } });

    const points = await sql`select address_text from tenant_pickup_points where tenant_id = ${TENANT} and is_active`;
    expect(points.map((point) => point.address_text)).toEqual(["Av. Chimalhuacán 120"]);
  });

  it("refuses cash for a delivery-only business and digital payments without Mercado Pago", async () => {
    await saveSetupCheckout(DELIVERY_TENANT, { step: "fulfillment", fulfillment: "delivery", delivery: { area: "Neza", fee: "25" } });
    const cash = await saveSetupCheckout(DELIVERY_TENANT, { step: "payment", method: "cash" });
    const digital = await saveSetupCheckout(DELIVERY_TENANT, { step: "payment", method: "digital" });
    expect(cash).toMatchObject({ ok: false, error: { code: "validation" } });
    expect(digital).toMatchObject({ ok: false, error: { code: "validation" } });

    const transfer = await saveSetupCheckout(DELIVERY_TENANT, {
      step: "payment",
      method: "transfer",
      transfer: { bank_name: "BBVA", account_holder: "Entregas Neza", clabe: "012180001234567890" },
    });
    expect(transfer.ok).toBe(true);
    const options = await getCheckoutOptions({ id: DELIVERY_TENANT, settings: {} });
    expect(options).toMatchObject({ deliveryEnabled: true, deliveryFee: 25, deliveryAreaLabel: "Neza", transferEnabled: true, cashEnabled: false });
  });
});
