import "server-only";

export function studioFlags() {
  return {
    enabled: process.env.STUDIO_ENABLED === "true",
    public: process.env.STUDIO_PUBLIC_ENABLED === "true",
    checkout:
      process.env.STUDIO_ENABLED === "true" &&
      process.env.STUDIO_CHECKOUT_ENABLED === "true",
    ai:
      process.env.STUDIO_ENABLED === "true" &&
      process.env.STUDIO_AI_ENABLED === "true",
    publish:
      process.env.STUDIO_ENABLED === "true" &&
      process.env.STUDIO_PUBLISH_ENABLED === "true",
  };
}
