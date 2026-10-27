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
}

export interface GrowthSettingsPatch {
  paused?: boolean;
  paused_reason?: string;
  signature?: string;
  send_start_hour?: number;
  send_end_hour?: number;
  send_days?: number[];
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
