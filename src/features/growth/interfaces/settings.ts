export interface GrowthSettings {
  paused: boolean;
  paused_reason: string | null;
  timezone: string;
  send_days: number[];
  send_start_hour: number;
  send_end_hour: number;
  signature: string;
  visit_municipios: string[];
  email_variant_weights: Record<string, number>;
  digest_hour: number;
  last_digest_on: string | null;
  /** «Para ti» of a business: what it offers and the button's words. */
  offer_title: string | null;
  offer_text: string | null;
  cta_label: string | null;
}

export interface GrowthSettingsPatch {
  paused?: boolean;
  paused_reason?: string;
  signature?: string;
  send_start_hour?: number;
  send_end_hour?: number;
  send_days?: number[];
  offer_title?: string;
  offer_text?: string;
  cta_label?: string;
}

export interface GrowthMailbox {
  id: string;
  address: string;
  display_name: string;
  secret_env_key: string;
  daily_cap: number;
  warmup_started_on: string | null;
  is_active: boolean;
  paused_reason: string | null;
  sent_today?: number;
  cap_today?: number;
  has_secret?: boolean;
}

export interface MailboxInput {
  address: string;
  display_name: string;
  secret_env_key: string;
  daily_cap?: number;
}

export interface EngineOverview {
  settings: GrowthSettings;
  mailboxes: GrowthMailbox[];
  telegram: { configured: boolean; linkedChats: number };
  enabled: boolean;
  postalAddressSet: boolean;
}
