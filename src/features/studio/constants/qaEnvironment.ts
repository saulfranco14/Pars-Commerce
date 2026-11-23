/** Vercel branch whose builds turn Studio on without dashboard variables; production keeps every flag off. */
export const STUDIO_QA_BRANCH = "qa_release";

/** Pilot only: Autolavado Villada. AI images run with GEMINI_API_KEY; checkout stays off until Tlaco's Mercado Pago account is set up. */
export const STUDIO_QA_ENV: Record<string, string> = {
  STUDIO_ENABLED: "true",
  STUDIO_AI_ENABLED: "true",
  STUDIO_PUBLIC_ENABLED: "true",
  STUDIO_PUBLISH_ENABLED: "true",
  NEXT_PUBLIC_STUDIO_PILOT_TENANT_IDS: "aff1e4bc-dfd5-4eb0-8053-ebf40f2fae7e",
};
