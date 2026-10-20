/** Dominio de producción. Único lugar donde vive; no repitas el literal. */
export const PRODUCTION_APP_URL = "https://tlaco.app";

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * URL pública para enlaces que salen del sitio (QR, webhooks, back_urls,
 * sitemap). Sin la variable cae en producción, nunca en una URL de preview.
 */
function getPublicAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? PRODUCTION_APP_URL).replace(/\/$/, "");
}

export { getAppUrl, getPublicAppUrl };
