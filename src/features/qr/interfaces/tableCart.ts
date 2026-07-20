import type { QrSessionMenuItem } from "@/features/qr/interfaces/tableSession";

export interface CartEntry {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

export type MenuItem = QrSessionMenuItem;
