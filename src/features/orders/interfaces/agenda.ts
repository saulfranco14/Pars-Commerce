import type { OrderListItem } from "@/types/orders";

export type AgendaBucketKey = "atrasados" | "hoy" | "manana" | "despues";

export interface AgendaBucket {
  key: AgendaBucketKey;
  label: string;
  orders: OrderListItem[];
}

export interface AgendaCounts {
  atrasados: number;
  hoy: number;
  manana: number;
  despues: number;
}
