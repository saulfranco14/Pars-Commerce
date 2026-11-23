import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { useStudioAssets } from "../hooks/useStudioAssets";
import type { useStudioEditor } from "../hooks/useStudioEditor";
import type { useStudioOutput } from "../hooks/useStudioOutput";
import type {
  StudioAsset,
  StudioDesignDetail,
  StudioIdea,
  StudioImage,
  StudioImageRequest,
  StudioSource,
  StudioSummary,
} from "./studio";
import type { StudioFormat, StudioNode, StudioScene } from "./scene";

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
  /** Numbered dots only, for one-screen editors. */
  compact?: boolean;
}
export interface StudioIdeasProps {
  ideas: StudioIdea[];
  loading: boolean;
  starting: StudioIdea["key"] | null;
  disabled: boolean;
  onStart: (idea: StudioIdea) => void;
}
export interface StudioSheetProps {
  open: boolean;
  onClose: () => void;
  disabled: boolean;
}
export interface StudioImageTileItem {
  key: string;
  label: string;
  url: string | null;
  badge?: "Tuya" | "Otro";
  selected: boolean;
  onPick: () => void;
}
export interface StudioImageTileProps {
  tile: StudioImageTileItem;
  disabled: boolean;
  size?: string;
}
export interface StudioImageStripProps {
  tiles: StudioImageTileItem[];
  disabled: boolean;
  onGenerate: () => void;
  onSeeAll: () => void;
}
export type StudioGenerateOptions = Pick<
  StudioImageRequest,
  "quality" | "scene" | "wish"
>;
export interface StudioGenerateSheetProps extends StudioSheetProps {
  balance: number;
  rechargeHref: string;
  onGenerate: (options: StudioGenerateOptions) => void;
}
export interface StudioTextSheetProps extends StudioSheetProps {
  designId: string;
  scene: StudioScene;
  source: StudioSource;
  catalogHref: string | null;
  onApply: (scene: StudioScene) => void;
  onMessage: (message: string) => void;
}
export interface StudioStyleSheetProps extends StudioSheetProps {
  scene: StudioScene;
  source: StudioSource;
  assets: StudioAsset[];
  tenantId: string;
  onApply: (scene: StudioScene) => void;
  onAdvanced: () => void;
}
export interface StudioFormatSheetProps extends StudioSheetProps {
  value: StudioFormat;
  onChange: (format: StudioFormat) => void;
}
export interface StudioPhotoSheetProps extends StudioSheetProps {
  onUpload: (file: File, kind: "image" | "logo") => void;
}
export interface StudioImagesSheetProps extends StudioSheetProps {
  tiles: StudioImageTileItem[];
}
export interface StudioUseImageSheetProps {
  image: StudioImage | null;
  onClose: () => void;
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
export type StudioOutputState = ReturnType<typeof useStudioOutput>;
export interface StudioWorkspaceParts {
  editor: StudioEditorState;
  asset: StudioAssetsState;
  tenantId: string;
  locked: boolean;
}
export interface StudioPosterEditorProps extends StudioWorkspaceParts {
  designId: string;
  catalogHref: string | null;
  rechargeHref: string;
  onAdvanced: () => void;
}
export interface StudioAdvancedEditorProps extends StudioWorkspaceParts {
  detail: StudioDesignDetail;
  output: StudioOutputState;
  onRefresh: () => Promise<unknown>;
  onSimple: () => void;
}
export interface StudioEditorNoticesProps {
  editor: StudioEditorState;
  stale: boolean;
  locked: boolean;
  errors: Array<string | null>;
  onRefresh: () => Promise<unknown>;
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
export interface StudioPendingBannerProps {
  onFinished: () => void;
}
export interface StudioReuseOption {
  value: "as_is" | "with_product";
  title: string;
  detail: string;
  cost: string;
}
