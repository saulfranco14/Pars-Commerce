export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  unit: string;
  type: string;
  image_url: string | null;
  theme: string | null;
  stock: number;
  created_at: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  price: number;
  cost_price: number;
  commission_amount: number | null;
  unit: string;
  type: string;
  track_stock: boolean;
  is_public: boolean;
  image_url: string | null;
  image_urls?: string[];
  theme: string | null;
  stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductPayload {
  tenant_id: string;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  price: number;
  cost_price: number;
  commission_amount?: number;
  unit?: string;
  type?: string;
  track_stock?: boolean;
  stock?: number;
  is_public?: boolean;
  image_url?: string;
  image_urls?: string[];
  theme?: string;
}

export interface UpdateProductPayload {
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  price?: number;
  cost_price?: number;
  commission_amount?: number;
  unit?: string;
  type?: string;
  track_stock?: boolean;
  is_public?: boolean;
  image_url?: string;
  image_urls?: string[];
  theme?: string;
  stock?: number;
}

export interface ProductCreated {
  id: string;
  name: string;
  slug: string;
  price: number;
  created_at: string;
}

export interface ProductUpdated {
  id: string;
  name: string;
  slug: string;
  price: number;
  type: string;
  image_url: string | null;
  updated_at: string;
}
