import type { PublicCartItem } from "@/services/publicCartService";

export interface StoreCartData {
  cart: { id: string; tenant_id: string } | null;
  items: PublicCartItem[];
  subtotal: number;
  items_count: number;
}

export interface StoreCartContextValue {
  cart: StoreCartData["cart"];
  items: PublicCartItem[];
  subtotal: number;
  itemsCount: number;
  isLoading: boolean;
  error: Error | null;
  lastAdded: { label: string; at: number } | null;
  mutate: (data?: StoreCartData, opts?: { revalidate?: boolean }) => void;
}
