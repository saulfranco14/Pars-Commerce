import type { QrSessionMenuItem } from "@/features/qr/interfaces/tableSession";

export interface CartEntry {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  list_unit_price: number;
  quantity: number;
  promotion_id: string | null;
  promotion_name: string | null;
  offer_group_id: string | null;
}

export type MenuItem = QrSessionMenuItem;
