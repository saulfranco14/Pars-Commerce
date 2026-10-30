export interface AssistedOnboardingInput {
  name?: string;
  slug?: string;
  business_type?: string;
  catalog_template_key?: string | null;
  site_template_id?: string | null;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  billing_mode?: "configuration_limited" | "contracted" | "courtesy";
  notes?: string;
  provisioning_key?: string;
}

export interface AssistedOnboardingResult {
  onboarding_id: string | null;
  tenant_id: string | null;
  tenant_slug: string | null;
  provisioning_key: string;
  invitation_url: string | null;
  preview_url: string | null;
  preview_expires_at: string | null;
  email_delivery: "sent" | "failed" | "not_needed";
}
