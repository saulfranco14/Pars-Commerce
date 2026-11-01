import { setDefaultResultOrder } from "node:dns";

// Some networks announce IPv6 to Google but cannot route it, and fetch then hangs until the timeout.
setDefaultResultOrder("ipv4first");

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
// Same defaults as pars_dev: Flash-Lite is cheap and available; GEMINI_MODEL changes it explicitly.
const PRIMARY_MODEL = process.env.GEMINI_MODEL?.trim() || process.env.GEMINI_FALLBACK_MODEL?.trim() || "gemini-3.5-flash-lite";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL?.trim() || "gemini-3.5-flash-lite";

export interface GenerateOptions {
  maxOutputTokens?: number;
  /** "minimal" skips the model's reasoning: faster and no thinking tokens to pay for short texts. */
  thinkingLevel?: "minimal" | "low";
}

export class GeminiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

function apiKey(): string {
  const key = process.env.IA_GEMINI ?? process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError(500, "Falta configurar la IA (IA_GEMINI).");
  return key;
}

function friendlyError(status: number, providerMessage?: string): GeminiError {
  if (status === 429) return new GeminiError(429, "Se agotó la cuota de la IA por ahora. Intenta en unos minutos o usa el mensaje sugerido.");
  if (status === 503) return new GeminiError(503, "La IA tiene mucha demanda en este momento. Intenta en unos minutos.");
  if (status === 401 || status === 403) return new GeminiError(status, "La llave de la IA no tiene permiso. Revisa IA_GEMINI.");
  return new GeminiError(status, providerMessage || "No pudimos comunicarnos con la IA.");
}

async function generate(model: string, system: string, prompt: string, key: string, options: GenerateOptions): Promise<string> {
  const response = await fetch(`${BASE_URL}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      store: false,
      generationConfig: {
        maxOutputTokens: options.maxOutputTokens ?? 700,
        temperature: 0.8,
        ...(options.thinkingLevel ? { thinkingConfig: { thinkingLevel: options.thinkingLevel } } : {}),
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const data = (await response.json().catch(() => null)) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } } | null;
  if (!response.ok) throw friendlyError(response.status, data?.error?.message);
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) throw new GeminiError(502, "La IA no devolvió texto. Intenta de nuevo.");
  return text;
}

/** One stateless generation, server-side only; falls back to the backup model when the main one is busy. */
export async function generateText(system: string, prompt: string, options: GenerateOptions = {}): Promise<string> {
  const key = apiKey();
  try {
    return await generate(PRIMARY_MODEL, system, prompt, key, options);
  } catch (error) {
    const status = error instanceof GeminiError ? error.status : 502;
    if ((status === 429 || status >= 500) && FALLBACK_MODEL !== PRIMARY_MODEL) return generate(FALLBACK_MODEL, system, prompt, key, options);
    throw error instanceof GeminiError ? error : new GeminiError(502, "No pudimos comunicarnos con la IA.");
  }
}
