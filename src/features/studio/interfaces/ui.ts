import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { useStudioAi } from "../hooks/useStudioAi";
import type { useStudioAssets } from "../hooks/useStudioAssets";
import type { useStudioEditor } from "../hooks/useStudioEditor";
import type { useStudioOutput } from "../hooks/useStudioOutput";
import type {
  StudioAsset,
  StudioDesignDetail,
  StudioIdea,
  StudioSource,
  StudioSummary,
} from "./studio";
import type {
  StudioFormat,
  StudioNode,
  StudioScene,
  StudioTemplateId,
} from "./scene";

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
  /** Read-only thumbnail: no guides, no hit testing, any width. */
  preview?: boolean;
}
export interface StudioScenePreviewProps {
  scene: StudioScene;
  assets: StudioAsset[];
  tenantId: string;
}
export type StudioStep = 1 | 2 | 3;
export interface StudioStepperProps {
  step: StudioStep;
  onStep?: (step: StudioStep) => void;
}
export interface StudioIdeasProps {
  ideas: StudioIdea[];
  loading: boolean;
  starting: StudioIdea["key"] | null;
  disabled: boolean;
  onStart: (idea: StudioIdea) => void;
}
export interface StudioDesignGalleryProps extends StudioScenePreviewProps {
  source: StudioSource;
  disabled: boolean;
  onPick: (template: StudioTemplateId) => void;
}
export interface StudioFormatPickerProps {
  value: StudioFormat;
  disabled: boolean;
  onChange: (format: StudioFormat) => void;
}
export interface StudioSheetProps {
  open: boolean;
  onClose: () => void;
  disabled: boolean;
}
export interface StudioTextSheetProps extends StudioSheetProps {
  scene: StudioScene;
  source: StudioSource;
  catalogHref: string | null;
  onApply: (scene: StudioScene) => void;
}
export interface StudioColorSheetProps extends StudioSheetProps {
  scene: StudioScene;
  onApply: (scene: StudioScene) => void;
}
export interface StudioPhotoSheetProps extends StudioSheetProps {
  assets: StudioAsset[];
  aiAvailable: boolean;
  onUpload: (file: File, kind: "image" | "logo") => void;
  onSelect: (assetId: string) => void;
  onImprove: () => void;
}
export interface StudioAiCardProps {
  balance: number;
  enabled: boolean;
  hasImage: boolean;
  disabled: boolean;
  rechargeHref: string;
  onImprove: () => void;
}
export interface StudioQuickReviewProps {
  scene: StudioScene;
  disabled: boolean;
  onFix: () => void;
}
export interface StudioActionBarProps {
  status?: string;
  children: ReactNode;
}
export interface StudioEditorBarProps {
  status: string;
  canEdit: boolean;
  saveDisabled: boolean;
  nextDisabled: boolean;
  onSave: () => void;
  onNext: () => void;
}
export interface StudioShareTileProps {
  icon: LucideIcon;
  title: string;
  detail: string;
  tone?: "accent" | "success";
  disabled?: boolean;
  onClick: () => void;
}
export type StudioEditorState = ReturnType<typeof useStudioEditor>;
export type StudioAssetsState = ReturnType<typeof useStudioAssets>;
export type StudioAiState = ReturnType<typeof useStudioAi>;
export type StudioOutputState = ReturnType<typeof useStudioOutput>;
export interface StudioWorkspaceParts {
  editor: StudioEditorState;
  asset: StudioAssetsState;
  ai: StudioAiState;
  tenantId: string;
  locked: boolean;
}
export interface StudioQuickEditorProps extends StudioWorkspaceParts {
  catalogHref: string | null;
  rechargeHref: string;
}
export interface StudioAdvancedEditorProps extends StudioWorkspaceParts {
  detail: StudioDesignDetail;
  output: StudioOutputState;
  onRefresh: () => Promise<unknown>;
}
export interface StudioAiProgressProps extends StudioWorkspaceParts {
  onRefresh: () => Promise<unknown>;
}
export interface StudioEditorNoticesProps {
  editor: StudioEditorState;
  designId: string;
  stale: boolean;
  locked: boolean;
  errors: Array<string | null>;
  onRefresh: () => Promise<unknown>;
  onMembership: () => void;
}
export interface StudioShareStepProps {
  output: StudioOutputState;
  editor: StudioEditorState;
  assets: StudioAsset[];
  designId: string;
  readOnly: boolean;
  onBack: () => void;
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
