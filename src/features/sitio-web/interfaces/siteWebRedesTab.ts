export interface SiteWebRedesTabProps {
  whatsappPhone: string;
  onWhatsappPhoneChange: (v: string) => void;
  instagramUrl: string;
  onInstagramUrlChange: (v: string) => void;
  facebookUrl: string;
  onFacebookUrlChange: (v: string) => void;
  twitterUrl: string;
  onTwitterUrlChange: (v: string) => void;
  loading: boolean;
  error: string | null;
  success: string | null;
  onSave: (e: React.FormEvent) => void;
}
