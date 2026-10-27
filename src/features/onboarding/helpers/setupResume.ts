export const SETUP_TEST_STEP = 4;

type OnboardingFlags = Partial<Record<"contact_completed" | "availability_completed" | "payment_completed", unknown>>;

/** First setup step still pending, read from the flags each step saves in tenants.settings.onboarding. */
export function resumeSetupStep(settings: unknown): number {
  const onboarding = (settings as { onboarding?: OnboardingFlags } | null)?.onboarding ?? {};
  if (onboarding.contact_completed !== true) return 0;
  if (onboarding.availability_completed !== true) return 1;
  if (onboarding.payment_completed !== true) return 3;
  return SETUP_TEST_STEP;
}
