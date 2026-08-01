// Mirrors `20260728000001_tenant_devices.sql`. Owner only: pairing a screen
// hands out a credential that creates orders in the business's name.
export const DEVICE_PERMISSIONS = {
  manage: "devices.manage",
} as const;
