export function promotionsKey(tenantId: string): string {
  return `/api/promotions?tenant_id=${encodeURIComponent(tenantId)}`;
}

export function productsKey(tenantId: string): string {
  return `/api/products?tenant_id=${encodeURIComponent(tenantId)}`;
}

export function subcatalogsKey(tenantId: string): string {
  return `/api/subcatalogs?tenant_id=${encodeURIComponent(tenantId)}`;
}
