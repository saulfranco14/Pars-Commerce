import type { StudioScene } from "./scene";

export type StudioSourceType =
  "product" | "promotion" | "subscription_plan" | "custom";
export type StudioPlanCode = "basic" | "pro" | "business";
export type StudioPermission =
  "studio.read" | "studio.create" | "studio.publish" | "studio.manage";
export type StudioChannel = "public_store" | "table_qr";
export type StudioSurface =
  | "store_home_campaign"
  | "promotion_card"
  | "promotion_detail"
  | "product_campaign"
  | "plan_card"
  | "plan_detail"
  | "qr_promotion"
  | "qr_menu_campaign";
export type StudioAiOperation = "improve_photo" | "style" | "variation";
export type StudioQuality = "economy" | "premium";
export type StudioJobStatus =
  "queued" | "processing" | "succeeded" | "failed" | "cancelled";

export interface StudioPlan {
  code: StudioPlanCode;
  name: string;
  amount_mxn: number;
  monthly_tlacos: number;
  monthly_reviews: number;
  catalog_version: number;
  is_active: boolean;
}

export interface StudioPack {
  code: string;
  name: string;
  amount_mxn: number;
  tlacos: number;
  catalog_version: number;
  is_active: boolean;
}

export interface StudioSource {
  type: StudioSourceType;
  id: string | null;
  name: string;
  description: string;
  conditions?: string;
  price: number | null;
  priceLabel: string;
  badge: string;
  period: string;
  imageUrls: string[];
  logoUrl?: string | null;
  businessName?: string;
  destinationUrl: string;
  status: string;
  validFrom: string | null;
  validUntil: string | null;
  channels: string[];
  isPublic: boolean;
  commercialHash: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string | null;
  }>;
}

export interface StudioDesign {
  id: string;
  tenant_id: string;
  created_by: string;
  title: string;
  source_type: StudioSourceType;
  source_id: string | null;
  source_snapshot: StudioSource;
  source_hash: string;
  draft_scene: StudioScene;
  revision: number;
  status: "draft" | "ready" | "archived";
  active_version_id: string | null;
  copy: string;
  destination_url: string;
  created_at: string;
  updated_at: string;
}

export interface StudioVersion {
  id: string;
  tenant_id: string;
  design_id: string;
  version: number;
  scene_json: StudioScene;
  scene_hash: string;
  source_snapshot: StudioSource;
  source_hash: string;
  created_at: string;
  is_preparation: boolean;
}

export interface StudioMembership {
  id: string;
  tenant_id: string;
  plan_code: StudioPlanCode;
  status:
    "pending_payment" | "active" | "past_due" | "cancelling" | "cancelled";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  pending_plan_code: StudioPlanCode | null;
  contracted_amount_mxn?: number;
  pending_amount_mxn?: number | null;
  plan_change_status?: "pending" | "confirmed" | null;
  ai_blocked: boolean;
}

export interface StudioBalance {
  monthly: number;
  purchased: number;
  reserved: number;
  available: number;
  expiresAt: string | null;
}

export interface StudioSummary {
  membership: StudioMembership | null;
  active: boolean;
  enabled: boolean;
  checkoutEnabled: boolean;
  aiEnabled: boolean;
  publishEnabled: boolean;
  permissions: StudioPermission[];
  owner: boolean;
  balance: StudioBalance;
  plans: StudioPlan[];
  packs: StudioPack[];
  recent: StudioDesign[];
  counts: { designs: number; ready: number; placements: number };
  /** Design that used the one free export; null while it is still available. */
}

export interface StudioDesignDetail {
  design: StudioDesign;
  source: StudioSource | null;
  stale: boolean;
  versions: StudioVersion[];
  assets: StudioAsset[];
}

export interface StudioAsset {
  id: string;
  design_id: string;
  kind: "original" | "generated" | "render" | "preview";
  status: "pending" | "ready";
  width: number | null;
  height: number | null;
  mime_type: string;
  url?: string;
  source_asset_id: string | null;
  created_at: string;
}

export interface StudioJob {
  id: string;
  design_id: string;
  status: StudioJobStatus;
  operation: StudioAiOperation;
  reserved_tlacos: number;
  result_asset_id: string | null;
  error_code: string | null;
  created_at: string;
}

export interface StudioQuote {
  id: string;
  cost: number;
  expiresAt: string;
  quality: StudioQuality;
}

export interface StudioPlacement {
  id: string;
  tenant_id: string;
  design_id: string;
  design_version_id: string;
  render_id: string;
  channel: StudioChannel;
  surface: StudioSurface;
  target_key: string;
  source_type: StudioSourceType;
  source_id: string | null;
  source_hash: string;
  title: string;
  alt_text: string;
  destination_url: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  disabled_reason: "retired" | "replaced" | "source_changed" | "expired" | null;
  created_at: string;
}

export interface StudioArtwork {
  placementId: string;
  url: string;
  alt: string;
  href: string | null;
  expiresAt: string | null;
  width: number;
  height: number;
}

export interface StudioBrand {
  colors: string[];
  font: "Arial" | "Georgia" | "Verdana";
  default_format: StudioScene["format"];
}

/** A ready-to-design suggestion built from the tenant's own catalog. */
export interface StudioIdea {
  key: "top_product" | "active_promotion" | "notice";
  sourceType: StudioSourceType;
  sourceId: string | null;
  title: string;
  detail: string;
  imageUrl: string | null;
}

/** An image the AI made for this business, reusable in any ad. */
export interface StudioImage {
  id: string;
  designId: string;
  title: string;
  url: string;
  createdAt: string;
}

export interface StudioRunJob extends StudioJob {
  result_url: string | null;
}

export interface StudioImageRequest {
  tenantId: string;
  designId: string;
  assetId: string;
  operation: StudioAiOperation;
  quality: StudioQuality;
  scene: "local" | "street" | "studio" | "surprise";
  wish: string;
  referenceAssetId?: string;
}

export interface StudioBatchRequest {
  tenantId: string;
  batchKey: string;
  sourceType: "product" | "promotion" | "subscription_plan";
  items: Array<{ id: string; name: string }>;
  mode: "shared" | "each";
  assetId?: string;
  template: "poster" | "poster_bottom" | "poster_framed";
  scene: StudioImageRequest["scene"];
  quality: StudioQuality;
}

export interface StudioBatchResult {
  designs: Array<{ id: string; title: string }>;
  jobs: Array<{ id: string; designId: string }>;
  skipped: Array<{ id: string; reason: string }>;
}
