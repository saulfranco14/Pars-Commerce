import type {
  ServiceError,
  ServiceResult,
} from "@/features/qr/services/tablePaymentService";
import type { StudioScene } from "./scene";
import type {
  StudioAiOperation,
  StudioQuality,
  StudioSourceType,
} from "./studio";

export interface StudioCreateInput {
  tenant_id: string;
  source_type: StudioSourceType;
  source_id?: string | null;
  title: string;
  idempotency_key: string;
}

export interface StudioSaveInput {
  tenant_id: string;
  revision: number;
  scene: StudioScene;
  title: string;
  copy: string;
  destination_url: string;
  status?: "draft" | "ready" | "archived";
  refresh_source?: boolean;
}

export interface StudioGenerationInput {
  tenant_id: string;
  design_id: string;
  asset_id: string;
  operation: StudioAiOperation;
  quality: StudioQuality;
  instructions: string;
}

export interface StudioApiError {
  error: string;
  code: string;
}

export interface StudioLocalCopyInput {
  scene: StudioScene;
  title: string;
  copy: string;
  destination_url: string;
}

export type StudioServiceResult<T> =
  | Extract<ServiceResult<T>, { ok: true }>
  | { ok: false; error: ServiceError & { studioCode: string; status: number } };
