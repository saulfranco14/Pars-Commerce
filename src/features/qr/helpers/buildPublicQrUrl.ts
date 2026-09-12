export function buildPublicQrUrl(token: string): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const configuredUrl = envUrl?.replace(/\/$/, "");
  const usesRetiredDomain = configuredUrl?.includes("pars-commerce.vercel.app");

  // The retired deployment must never be embedded into newly downloaded QR
  // images, even if an old environment variable has not been updated yet.
  if (configuredUrl && !usesRetiredDomain) {
    return `${configuredUrl}/q/${token}`;
  }

  const canonicalUrl = "https://tlaco.vercel.app";

  if (typeof window !== "undefined") {
    const currentOrigin = window.location.origin;
    if (!currentOrigin.includes("localhost") && !currentOrigin.includes("127.0.0.1")) {
      return `${currentOrigin}/q/${token}`;
    }
  }
  return `${canonicalUrl}/q/${token}`;
}
