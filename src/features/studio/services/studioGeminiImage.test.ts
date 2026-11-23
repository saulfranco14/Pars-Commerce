import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateStudioGeminiImage } from "./studioGeminiImage";

vi.mock("server-only", () => ({}));

const input = {
  model: "gemini-nano-banana-2.1",
  prompt: "Edit the product photo",
  images: [],
  aspectRatio: "1:1",
};

const retryInfo = {
  "@type": "type.googleapis.com/google.rpc.RetryInfo",
  retryDelay: "0s",
};

function rateLimited(details: unknown[] = [], headers?: HeadersInit) {
  return Response.json({ error: { details } }, { status: 429, headers });
}

describe("Studio Gemini image rate limits", () => {
  const fetchImage = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("STUDIO_GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", fetchImage.mockReset());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("retries once with the original request and returns the generated image", async () => {
    fetchImage.mockResolvedValueOnce(rateLimited([retryInfo]));
    fetchImage.mockResolvedValueOnce(
      Response.json({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { data: "AQ==", mimeType: "image/png" } }],
            },
          },
        ],
      }),
    );

    await expect(generateStudioGeminiImage(input)).resolves.toEqual({
      bytes: Buffer.from([1]),
      mime: "image/png",
    });
    expect(fetchImage).toHaveBeenCalledTimes(2);
    expect(fetchImage.mock.calls[1]).toEqual(fetchImage.mock.calls[0]);
  });

  it("stops after the second 429", async () => {
    fetchImage.mockImplementation(async () =>
      rateLimited([], { "Retry-After": "0" }),
    );

    await expect(generateStudioGeminiImage(input)).rejects.toMatchObject({
      code: "PROVIDER_HTTP_429",
    });
    expect(fetchImage).toHaveBeenCalledTimes(2);
  });

  it.each<[string, unknown[], HeadersInit]>([
    ["no retry hint", [], {}],
    ["long wait", [retryInfo], { "Retry-After": "30" }],
    [
      "zero quota",
      [
        retryInfo,
        {
          "@type": "type.googleapis.com/google.rpc.QuotaFailure",
          violations: [{ quotaValue: "0" }],
        },
      ],
      {},
    ],
  ])("returns the 429 immediately with %s", async (_, details, headers) => {
    fetchImage.mockResolvedValueOnce(rateLimited(details, headers));

    await expect(generateStudioGeminiImage(input)).rejects.toMatchObject({
      code: "PROVIDER_HTTP_429",
    });
    expect(fetchImage).toHaveBeenCalledTimes(1);
  });
});
