export type SplitMode = "by_device" | "equal" | "items";

export interface SplitGroup {
  id: string;
  label: string;
  total: number;
  paid_total: number;
  balance_due: number;
  payment_status: "pending" | "paid";
  device_id?: string | null;
}
