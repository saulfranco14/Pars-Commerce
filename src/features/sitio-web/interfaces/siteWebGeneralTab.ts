import type { SiteTemplate } from "@/services/siteTemplatesService";

export interface SiteWebGeneralTabProps {
  tenantSlug: string;
  publicStoreEnabled: boolean;
  publicStoreLoading: boolean;
  onTogglePublicStore: (e: React.ChangeEvent<HTMLInputElement>) => void;
  templates: SiteTemplate[];
  selectedTemplateId: string | null;
  onTemplateSelect: (t: SiteTemplate) => void;
  themeColor: string;
  onThemeColorChange: (value: string) => void;
  appearanceLoading: boolean;
  appearanceDirty: boolean;
  appearanceSuccess: string | null;
  onSaveAppearance: (e: React.FormEvent) => void;
}
