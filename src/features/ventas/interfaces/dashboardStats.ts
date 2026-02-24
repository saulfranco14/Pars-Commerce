export interface CatalogStats {
  products_count: number;
  services_count: number;
}

export interface SalesByItemRow {
  id: string;
  name: string;
  quantity: number;
  total: number;
}

export interface SalesByItem {
  products: SalesByItemRow[];
  services: SalesByItemRow[];
}
