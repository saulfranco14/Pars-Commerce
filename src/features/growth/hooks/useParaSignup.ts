"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createAccount } from "@/features/auth/services/signupClient";
import { sendParaEvent } from "@/features/growth/services/paraClient";
import { deriveSlug } from "@/features/onboarding/helpers/deriveSlug";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { createClient } from "@/lib/supabase/client";
import { create as createTenant } from "@/services/tenantsService";

import type { RegistrationIntent } from "@/features/auth/registrationIntent";
import type { ParaAdsPageData, ParaSignupValues } from "@/features/growth/interfaces/paraAds";

/**
 * One step: account → session → business with the prospect's giro and catalog.
 * The token travels in the intent, so the registration is credited to whoever works the prospect.
 */
export function useParaSignup(token: string, prefill: ParaAdsPageData["prefill"]) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: ParaSignupValues) {
    setSaving(true);
    setError(null);
    sendParaEvent(token, "signup_started");
    const name = values.businessName.trim();
    const intent: RegistrationIntent = {
      entryProduct: "studio",
      studioAction: "home",
      entryOrigin: "prospecto",
      plan: "free",
      giro: prefill.businessType,
      catalogKey: prefill.catalogKey ?? undefined,
      businessName: name,
      phone: values.phone,
      prospectToken: token,
    };
    try {
      const email = values.email.trim();
      await createAccount(email, values.password, intent);
      const supabase = createClient();
      // A previous account's stale session fails its refresh and would wipe the new one mid-signup.
      await supabase.auth.signOut({ scope: "local" });
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: values.password });
      if (signInError) throw signInError;
      const tenant = (await createTenant({
        name,
        slug: deriveSlug(name),
        business_type: prefill.businessType,
        catalog_template_key: prefill.catalogKey ?? undefined,
        registration_intent: intent,
      })) as { id: string };
      router.push(`/dashboard/preparar-negocio?tenant=${encodeURIComponent(tenant.id)}`);
      router.refresh();
    } catch (err) {
      setError(resolveUserError(err, "supabase"));
      setSaving(false);
    }
  }

  return { submit, saving, error, clearError: () => setError(null) };
}
