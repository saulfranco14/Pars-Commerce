import "server-only";
import { StudioError } from "./studioErrors";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
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
  constructor(
    public code: string,
    public retryable = false,
  ) {
    super(code);
  }
}

export async function generateStudioGeminiImage(input: {
  model: string;
  prompt: string;
  images: Array<{ bytes: Buffer; mime: string }>;
  aspectRatio: string;
}): Promise<{ bytes: Buffer; mime: string }> {
  const key = studioGeminiKey();
  if (!key) throw new StudioError("NOT_CONFIGURED");
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${input.model}:generateContent`, {
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
      signal: AbortSignal.timeout(50_000),
    });
  } catch {
    throw new StudioProviderFailure("PROVIDER_TIMEOUT", true);
  }
  const data = (await response.json().catch(() => null)) as {
    candidates?: Array<{
      finishReason?: string;
      content?: {
        parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
      };
    }>;
    error?: { message?: string };
  } | null;
  if (!response.ok) {
    console.error("[studio] Gemini image failed", {
      status: response.status,
      message: data?.error?.message,
    });
    throw new StudioProviderFailure(
      `PROVIDER_HTTP_${response.status}`,
      response.status === 429 || response.status >= 500,
    );
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
