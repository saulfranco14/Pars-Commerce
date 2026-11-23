import "server-only";
import { StudioError } from "./studioErrors";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 50_000;
const MAX_RETRY_DELAY_MS = 5_000;
const DEFAULT_MODELS: Record<string, string> = {
  STUDIO_GEMINI_IMAGE_MODEL: "gemini-nano-banana-2.1",
  STUDIO_GEMINI_PREMIUM_MODEL: "gemini-3-pro-image",
};

/** The model for a route: the env value when set, otherwise the recommended default. */
export function studioModelFor(modelEnv: string): string | null {
  const value = process.env[modelEnv]?.trim() || DEFAULT_MODELS[modelEnv];
  return value && /^[a-zA-Z0-9._-]{1,100}$/.test(value) ? value : null;
}

export function studioGeminiKey(): string | null {
  return (
    process.env.STUDIO_GEMINI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.IA_GEMINI?.trim() ||
    null
  );
}

export class StudioProviderFailure extends Error {
  constructor(public code: string) {
    super(code);
  }
}

interface GeminiError {
  message?: string;
  details?: Array<{
    "@type": string;
    retryDelay?: string;
    violations?: Array<{
      quotaId?: string;
      quotaValue?: string | number;
    }>;
  }>;
}

function geminiRetryDelay(response: Response, error?: GeminiError) {
  if (response.status !== 429) return null;
  const details = error?.details ?? [];
  const quota = details.find(
    (detail) => detail["@type"] === "type.googleapis.com/google.rpc.QuotaFailure",
  );
  if (
    quota?.violations?.some(
      (violation) =>
        String(violation.quotaValue) === "0" ||
        /perday/i.test(violation.quotaId ?? ""),
    )
  )
    return null;

  const header = response.headers.get("retry-after")?.trim();
  const hint = details.find(
    (detail) => detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
  )?.retryDelay;
  const headerDelay =
    header && /^\d+$/.test(header)
      ? Number(header) * 1000
      : Date.parse(header ?? "") - Date.now();
  const bodyDelay =
    hint && /^\d+(\.\d+)?s$/.test(hint)
      ? Number(hint.slice(0, -1)) * 1000
      : NaN;
  const requiredDelays = [headerDelay, bodyDelay].filter(Number.isFinite);
  if (!requiredDelays.length) return null;
  const delay = Math.max(0, ...requiredDelays);
  return delay <= MAX_RETRY_DELAY_MS ? delay : null;
}

export async function generateStudioGeminiImage(input: {
  model: string;
  prompt: string;
  images: Array<{ bytes: Buffer; mime: string }>;
  aspectRatio: string;
}): Promise<{ bytes: Buffer; mime: string }> {
  const key = studioGeminiKey();
  if (!key) throw new StudioError("NOT_CONFIGURED");
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            ...input.images.map((image) => ({
              inlineData: {
                mimeType: image.mime,
                data: image.bytes.toString("base64"),
              },
            })),
            { text: input.prompt },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: input.aspectRatio },
      },
    }),
    signal,
  };
  type GeminiResponse = {
    candidates?: Array<{
      finishReason?: string;
      content?: {
        parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
      };
    }>;
    error?: GeminiError;
  };
  const requestImage = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/${input.model}:generateContent`,
        init,
      );
      const data = (await response.json().catch(() => null)) as GeminiResponse | null;
      signal.throwIfAborted();
      return { response, data };
    } catch {
      throw new StudioProviderFailure("PROVIDER_TIMEOUT");
    }
  };
  let { response, data } = await requestImage();
  const retryDelay = geminiRetryDelay(response, data?.error);
  if (retryDelay !== null) {
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
    ({ response, data } = await requestImage());
  }
  if (!response.ok) {
    console.error("[studio] Gemini image failed", {
      status: response.status,
      message: data?.error?.message,
    });
    throw new StudioProviderFailure(`PROVIDER_HTTP_${response.status}`);
  }
  const image = data?.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  )?.inlineData;
  if (!image?.data)
    throw new StudioProviderFailure(
      data?.candidates?.[0]?.finishReason === "SAFETY"
        ? "PROVIDER_SAFETY"
        : "NO_IMAGE_RETURNED",
    );
  return {
    bytes: Buffer.from(image.data, "base64"),
    mime: image.mimeType ?? "image/png",
  };
}
