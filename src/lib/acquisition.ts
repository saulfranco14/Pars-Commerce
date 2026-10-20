/**
 * First-touch acquisition: the campaign that first brought the visitor, kept in
 * localStorage so it survives the jump from the landing to /registro (CTAs drop
 * the query string). Pure browser storage, no PII.
 */

const STORAGE_KEY = "tlaco_acquisition";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export interface Acquisition {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
  /** Click id from Meta/Google ads, when there is no UTM. */
  clickId?: string;
  landing: string;
  capturedAt: number;
}

function clean(value: string | null): string | undefined {
  const v = value?.trim().slice(0, 80);
  return v ? v : undefined;
}

function readStored(): Acquisition | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Acquisition;
    return Date.now() - parsed.capturedAt < TTL_MS ? parsed : null;
  } catch {
    return null;
  }
}

function fromLocation(): Acquisition | null {
  const params = new URLSearchParams(window.location.search);
  const utm = Object.fromEntries(UTM_KEYS.map((k) => [k, clean(params.get(k))]));
  const clickId = params.get("fbclid") ? "fbclid" : params.get("gclid") ? "gclid" : undefined;

  let referrerHost: string | undefined;
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.host !== window.location.host) referrerHost = ref.host;
  } catch {
    referrerHost = undefined;
  }

  if (!utm.utm_source && !clickId && !referrerHost) return null;

  return {
    source: utm.utm_source ?? (clickId === "fbclid" ? "meta" : clickId === "gclid" ? "google" : referrerHost ?? "direct"),
    medium: utm.utm_medium ?? (clickId ? "paid" : "referral"),
    campaign: utm.utm_campaign ?? "none",
    content: utm.utm_content,
    term: utm.utm_term,
    clickId,
    landing: window.location.pathname,
    capturedAt: Date.now(),
  };
}

/** Keeps the first campaign touch; later visits only fill it in when it expired. */
export function captureAcquisition(): void {
  if (typeof window === "undefined" || readStored()) return;
  if (/^\/(q|dashboard|api)(\/|$)/.test(window.location.pathname)) return;
  const touch = fromLocation();
  if (!touch) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(touch));
  } catch {
    /* Storage blocked (private mode): attribution is best-effort. */
  }
}

/** Flat props for analytics events: `{ source: "direct" }` when nothing was captured. */
export function getAcquisitionProps(): Record<string, string> {
  if (typeof window === "undefined") return { source: "direct" };
  const a = readStored();
  if (!a) return { source: "direct" };
  return {
    source: a.source,
    medium: a.medium,
    campaign: a.campaign,
    ...(a.content ? { content: a.content } : {}),
    landing: a.landing,
  };
}
