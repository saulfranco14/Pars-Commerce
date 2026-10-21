import type { PublicCartItem } from "@/services/publicCartService";
import type { CartPlanLine } from "@/types/cart";

export interface StoreCartData {
  cart: { id: string; tenant_id: string } | null;
  items: PublicCartItem[];
  subtotal: number;
  items_count: number;
  plans?: CartPlanLine[];
  plans_total?: number;
}

export interface StoreCartContextValue {
  cart: StoreCartData["cart"];
  items: PublicCartItem[];
  subtotal: number;
  itemsCount: number;
  plans: CartPlanLine[];
  /** First period of every plan, charged today on top of `subtotal`. */
  plansTotal: number;
  isLoading: boolean;
  error: Error | null;
  lastAdded: { label: string; at: number } | null;
  mutate: (data?: StoreCartData, opts?: { revalidate?: boolean }) => void;
}
