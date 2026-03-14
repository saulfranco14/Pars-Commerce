import type { ProductListItem } from "@/types/products";

export interface LoanItem {
  product: ProductListItem;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CustomerPickerProps {
  activeTenantId: string;
  selected: import("@/types/customers").Customer | null;
  onSelect: (c: import("@/types/customers").Customer) => void;
  onClear: () => void;
  error?: string;
}

export interface LoanItemRowProps {
  item: LoanItem;
  index: number;
  onQuantityChange: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
}

export interface AddProductProps {
  activeTenantId: string;
  onAdd: (product: ProductListItem) => void;
}
