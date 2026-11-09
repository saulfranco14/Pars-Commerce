import type { ReactNode } from "react";
import type { StudioAsset, StudioDesignDetail, StudioSummary } from "./studio";
import type { StudioNode, StudioScene } from "./scene";

export interface StudioScope {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  userId: string;
  children: ReactNode;
}
export interface StudioContextValue {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  userId: string;
  summary: StudioSummary | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refresh: () => Promise<unknown>;
}
export interface StudioEditorProps {
  detail: StudioDesignDetail;
  onRefresh: () => Promise<unknown>;
  initialReview?: boolean;
}
export interface StudioCanvasProps {
  scene: StudioScene;
  selectedId: string | null;
  assets: StudioAsset[];
  tenantId: string;
  readOnly: boolean;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<StudioNode>) => void;
}
export interface StudioPropertiesProps {
  node: StudioNode | null;
  readOnly: boolean;
  onChange: (id: string, patch: Partial<StudioNode>) => void;
}
export interface StudioOptionsProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export interface StudioCanvasNodeProps {
  node: StudioNode;
  width: number;
  height: number;
  renderScale: number;
  url: string | null;
  readOnly: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<StudioNode>) => void;
  onEdit: () => void;
}
