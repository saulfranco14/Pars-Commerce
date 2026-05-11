import type { TableOrderItem } from "@/features/qr/interfaces/tableOrder";
import type { OrderDevice } from "@/features/qr/interfaces/orderDevice";

export interface DeviceSplitPreview {
  deviceId: string;
  label: string;
  total: number;
}

export function computeSplitByDevice(
  items: TableOrderItem[],
  devices: OrderDevice[],
): DeviceSplitPreview[] {
  const totals = new Map<string, number>();
  for (const device of devices) totals.set(device.id, 0);

  let sharedTotal = 0;
  for (const item of items) {
    const amount = Number(item.subtotal ?? 0);
    if (item.is_shared || !item.added_by_device_id) {
      sharedTotal += amount;
      continue;
    }
    totals.set(
      item.added_by_device_id,
      Number(totals.get(item.added_by_device_id) ?? 0) + amount,
    );
  }

  const sharedPerDevice = devices.length > 0 ? sharedTotal / devices.length : 0;
  return devices.map((device, index) => ({
    deviceId: device.id,
    label: device.display_name || `Comensal ${index + 1}`,
    total: Number(totals.get(device.id) ?? 0) + sharedPerDevice,
  }));
}
