export function buildPublicQrUrl(token: string): string {
  // Prefer the configured public app URL so QR codes always point to production,
  // regardless of where the dashboard is being viewed from.
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return `${envUrl.replace(/\/$/, "")}/q/${token}`;

  if (typeof window !== "undefined") {
    return `${window.location.origin}/q/${token}`;
  }
  return `/q/${token}`;
}
