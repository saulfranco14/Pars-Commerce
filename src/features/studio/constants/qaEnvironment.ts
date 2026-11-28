/** Vercel branch whose builds turn Studio on without dashboard variables. */
export const STUDIO_QA_BRANCH = "qa_release";

/** Every business sees Studio. AI images run with GEMINI_API_KEY; recharges charge real money with Tlaco's Mercado Pago token. */
export const STUDIO_QA_ENV: Record<string, string> = {
  STUDIO_ENABLED: "true",
  STUDIO_AI_ENABLED: "true",
  STUDIO_CHECKOUT_ENABLED: "true",
  STUDIO_PUBLIC_ENABLED: "true",
  STUDIO_PUBLISH_ENABLED: "true",
  NEXT_PUBLIC_STUDIO_BUSINESS_ENABLED: "true",
};

/** Production while it is free: every business with its gifted Tlacos; recharges and the public /studio page stay off. */
export const STUDIO_PRODUCTION_ENV: Record<string, string> = {
  STUDIO_ENABLED: "true",
  STUDIO_AI_ENABLED: "true",
  STUDIO_PUBLISH_ENABLED: "true",
  STUDIO_CHECKOUT_ENABLED: "false",
  STUDIO_PUBLIC_ENABLED: "false",
  NEXT_PUBLIC_STUDIO_BUSINESS_ENABLED: "true",
};

/** The Studio flags a build gets from its Vercel branch and environment; local builds keep their own. */
export function studioBuildEnv(
  branch: string | undefined,
  vercelEnv: string | undefined,
): Record<string, string> {
  if (branch === STUDIO_QA_BRANCH) return STUDIO_QA_ENV;
  return vercelEnv === "production" ? STUDIO_PRODUCTION_ENV : {};
}
