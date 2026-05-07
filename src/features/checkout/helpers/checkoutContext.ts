import type { createAdminClient } from "@/lib/supabase/admin";
import type { RecurringPurchasesConfig } from "@/types/subscriptions";

import type { CartItemRow } from "@/features/checkout/helpers/cartItemMappers";
import type { PublicCheckoutPayload } from "@/features/checkout/interfaces/publicCheckout";

export interface CheckoutContext {
  admin: ReturnType<typeof createAdminClient>;
  payload: PublicCheckoutPayload;
  tenantSlug: string;
  recurringConfig: RecurringPurchasesConfig;
  cartItems: CartItemRow[];
  subtotal: number;
  customerId: string | null;
  order: {
    id: string;
    checkout_session_id: string | null;
  };
  origin: string;
  idempotencyKey: string;
  expiresAt: string;
  installments: number;
  frequency: number;
  frequencyType: "weeks" | "months";
}
