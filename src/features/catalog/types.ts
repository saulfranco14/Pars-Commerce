export interface CatalogTemplatePreview {
  key: string;
  version: number;
  business_type: string;
  name: string;
  description: string | null;
  products_count: number;
  services_count: number;
}
