import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { useStudioAssets } from "../hooks/useStudioAssets";
import type { useStudioEditor } from "../hooks/useStudioEditor";
import type { useStudioPhotos } from "../hooks/useStudioPhotos";
import type { useStudioDesigns } from "../hooks/useStudioDesigns";
import type { useStudioAd } from "../hooks/useStudioAd";
import type { STUDIO_AD_AI_TEXT, StudioAdStatus } from "../constants/studio";
import type {
  StudioPreparedOutput,
  useStudioOutput,
} from "../hooks/useStudioOutput";
import type {
  StudioAsset,
  StudioDesign,
  StudioDesignDetail,
  StudioIdea,
  StudioImage,
  StudioImageRequest,
  StudioShelfItem,
  StudioSource,
  StudioSummary,
  StudioSurface,
  StudioVersion,
} from "./studio";
import type {
  StudioDesignId,
  StudioFormat,
  StudioNode,
  StudioScene,
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
  /** Crear asked for a new AI image; the ad view spends it once. */
  autoAi?: boolean;
  detail: StudioDesignDetail;
  onRefresh: () => Promise<unknown>;
  initialReview?: boolean;
  /** Opened from «Anuncios»: going back returns there. */
  fromAds?: boolean;
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
export interface StudioDesignOption {
  id: StudioDesignId;
  name: string;
  scene: StudioScene;
}
export interface StudioDesignCarouselProps {
  options: StudioDesignOption[];
  /** Index of the design the ad uses now; -1 for an older template. */
  active: number;
  onPick: (index: number) => void;
  assets: StudioAsset[];
  tenantId: string;
  disabled: boolean;
  /** Shown over the chosen design (the draft stamp, for one). */
  overlay?: ReactNode;
  /** Veils every design with a moving light while the AI makes the image. */
  generating?: boolean;
  /** Labels in light text, for the full-screen wait. */
  dark?: boolean;
  /** A last card after the designs, such as «Otra imagen». */
  endCard?: ReactNode;
  /** Share of the row one design takes, so the next one peeks in. */
  cardShare?: number;
  /** Tallest a design may get, as a share of the screen height. */
  maxVh?: number;
}
export interface StudioGeneratingScreenProps {
  ad: StudioAdState;
  title: string;
  carousel: ReactNode;
  /** Label of the way out: «Usar mi foto», or «Seguir con texto» with no photo. */
  goOnLabel: string;
}
export interface StudioMoreCardProps {
  disabled: boolean;
  /** Why the AI cannot run now, shown instead of the button. */
  blocked: string | null;
  rechargeHref: string;
  onGenerate: () => void;
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
  /** The image is still being made: the tile looks normal and shows progress. */
  waiting?: boolean;
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
export interface StudioPhotoInput {
  editor: StudioEditorState;
  asset: StudioAssetsState;
  tenantId: string;
  designId: string;
}
export type StudioPhotosState = ReturnType<typeof useStudioPhotos>;
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
  /** Taking the catalog's new data on its own; the manual notice waits. */
  updating?: boolean;
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
export type StudioBatchPhase = "pick" | "creating" | "done";
export interface StudioBatchRow {
  /** The catalog item the ad is for. */
  id: string;
  name: string;
  status:
    "waiting" | "creating" | "queued" | "image" | "done" | "failed" | "later";
  designId?: string;
  imageUrl?: string;
  reason?: string;
}
export interface StudioBatchProgressProps {
  phase: StudioBatchPhase;
  mode: "shared" | "each";
  rows: StudioBatchRow[];
  imageStartedAt: number | null;
  error: string | null;
  base: string;
  onReset: () => void;
}
export interface StudioPlacementSheetProps {
  open: boolean;
  onClose: () => void;
  output: StudioPreparedOutput;
  tenantId: string;
  assets: StudioAsset[];
  title: string;
  destination: string;
  onSuccess: (message: string, surfaces: StudioSurface[]) => void;
}
export interface StudioShelfRowProps {
  item: StudioShelfItem;
  tenantId: string;
  /** Set when the item already has an ad: the row opens it. */
  adHref?: string;
  creating: boolean;
  disabled: boolean;
  onCreate: () => void;
}
export interface StudioAiToggleProps {
  on: boolean;
  onChange: (on: boolean) => void;
  /** Off when the AI is not active for the account or there are no Tlacos. */
  reason: "ready" | "inactive" | "empty";
  rechargeHref: string;
}
export type StudioAdAiKind = keyof typeof STUDIO_AD_AI_TEXT;
export type StudioDesignsState = ReturnType<typeof useStudioDesigns>;
export interface StudioAdInput extends StudioPhotoInput {
  photos: StudioPhotosState;
  designs: StudioDesignsState;
  /** Set when Crear asked for a new AI image; spent once per ad. */
  autoAi: boolean;
}
export type StudioAdState = ReturnType<typeof useStudioAd>;
export interface StudioNoPhotoSheetProps extends StudioSheetProps {
  name: string;
  canIllustrate: boolean;
  aiOn: boolean;
  onCamera: (file: File) => void;
  onScene: () => void;
  onText: () => void;
}
export interface StudioAskCardProps {
  name: string;
  saving: boolean;
  onSave: (text: string) => void;
  onSkip: () => void;
}
export interface StudioValiditySheetProps extends StudioSheetProps {
  saving: boolean;
  onSave: (day: string) => Promise<boolean>;
}
export interface StudioChangeSheetProps extends StudioSheetProps {
  photos: StudioPhotosState;
  designs: StudioDesignsState;
  ad: StudioAdState;
  assets: StudioAsset[];
  tenantId: string;
  onByHand: () => void;
}
export interface StudioShareSheetProps extends StudioSheetProps {
  /** The share image matches the ad on screen; until then the tiles wait. */
  prepared: boolean;
  output: StudioOutputState;
  editor: StudioEditorState;
  assets: StudioAsset[];
  draft: boolean;
  homeHref: string;
  adsHref: string;
  /** Called after publishing with the places it went to. */
  onPublished: (surfaces: StudioSurface[]) => void;
}
export interface StudioAdViewProps extends StudioWorkspaceParts {
  designId: string;
  output: StudioOutputState;
  autoAi: boolean;
  saveText: string;
  onByHand: () => void;
  /** The saved version that still matches the ad; it opens ready to share. */
  reusable: StudioVersion | null;
  lastSharedAt: string | null;
  /** The ad is taking the product's new name and price. */
  updating: boolean;
  fromAds: boolean;
}
export interface StudioAdReadyProps {
  scene: StudioScene;
  assets: StudioAsset[];
  tenantId: string;
}
export type StudioChangeTab = "design" | "photo" | "phrase";
export type StudioPublishPhase = "drawing" | "uploading" | "ready";
export interface StudioPublishStepsProps {
  /** One phase per ticked space. */
  phases: StudioPublishPhase[];
}
export interface StudioPublishedSheetProps {
  open: boolean;
  onClose: () => void;
  surfaces: StudioSurface[];
  /** The published scene, drawn again in the size of each place. */
  scene: StudioScene | null;
  assets: StudioAsset[];
  tenantId: string;
  storeUrl: string;
  homeHref: string;
}
export interface StudioCreatingScreenProps {
  name: string;
}
export interface StudioAdsSectionProps {
  designs: StudioDesign[];
  base: string;
  tenantId: string;
  canPublish: boolean;
  /** After a bulk publish, so the summary catches up. */
  onChanged: () => void;
}
export interface StudioAdCardProps {
  design: StudioDesign;
  state: StudioAdStatus;
  href: string;
  tenantId: string;
  selecting: boolean;
  picked: boolean;
  /** Why it cannot be picked; null when it can. */
  blocked: string | null;
  sent: boolean;
  onToggle: () => void;
}
export interface StudioMultiShareSheetProps {
  open: boolean;
  onClose: () => void;
  count: number;
  /** Some picked images are still being made. */
  waiting: boolean;
  busy: boolean;
  error: string | null;
  onShare: (kind: "chats" | "status") => void;
}
/** The business home's invitation to Studio, until the first ad or until closed. */
export interface StudioHomeInvite {
  show: boolean;
  /** No ad yet: the banner invites to the first one. */
  first: boolean;
  tlacos: number;
  href: string;
  close: () => void;
}
