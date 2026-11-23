import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { afterEach, expect, it, vi } from "vitest";
import { requireStudioAccess } from "./studioAccessService";
import { createStudioQuote } from "./studioAiService";
import { generateStudioGeminiImage } from "./studioGeminiImage";
import { generateStudioImageNow } from "./studioImageService";

vi.mock("server-only", () => ({}));
vi.mock("./studioAccessService", () => ({ requireStudioAccess: vi.fn() }));
vi.mock("./studioAiService", () => ({ createStudioQuote: vi.fn() }));
vi.mock("./studioGeminiImage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./studioGeminiImage")>()),
  generateStudioGeminiImage: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

it("finishes a generated image after Supabase saves the asset with an empty response", async () => {
  const tenant = randomUUID();
  const design = randomUUID();
  const asset = randomUUID();
  const jobId = randomUUID();
  const lease = randomUUID();
  const image = await sharp({
    create: { width: 2, height: 2, channels: 3, background: "red" },
  })
    .jpeg()
    .toBuffer();
  const finish = vi.fn();
  let resultAsset: string | null = null;
  const db = createClient("https://studio.test", "test-key", {
    auth: { persistSession: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        const resource = url.pathname.split("/").at(-1);
        const method = init?.method ?? "GET";
        switch (resource) {
          case "studio_rate_limit":
            return Response.json(true);
          case "studio_enqueue_generation":
            return Response.json({ id: jobId, status: "queued" });
          case "studio_claim_job":
            return Response.json({
              id: jobId,
              tenant_id: tenant,
              design_id: design,
              input_asset_id: asset,
              route_id: "gemini",
              route_snapshot: [
                {
                  id: "gemini",
                  provider: "gemini",
                  model: "test",
                  estimated_cost_usd: 0.02,
                },
              ],
              instructions: "Edit this photo",
              lease_token: lease,
            });
          case "studio_designs":
            return Response.json({ draft_scene: { format: "square" } });
          case "studio_assets":
            return method === "POST"
              ? new Response(null, { status: 201 })
              : Response.json({
                  id: asset,
                  storage_path: "test.jpg",
                  mime_type: "image/jpeg",
                });
          case "test.jpg":
            return new Response(Uint8Array.from(image));
          case jobId + ".jpg":
            return Response.json({ Key: jobId + ".jpg" });
          case "studio_ai_attempts":
            return method === "POST"
              ? Response.json({ id: "attempt" })
              : new Response(null, { status: 204 });
          case "studio_finish_job": {
            const args = JSON.parse(String(init?.body));
            finish(args);
            resultAsset = args.p_asset_id;
            return Response.json(true);
          }
          case "studio_ai_jobs":
            return Response.json({
              id: jobId,
              result_asset_id: resultAsset,
              status: resultAsset ? "succeeded" : "failed",
            });
          default:
            throw new Error(`Unexpected test request: ${method} ${url.pathname}`);
        }
      },
    },
  });

  vi.stubEnv("STUDIO_ENABLED", "true");
  vi.stubEnv("STUDIO_AI_ENABLED", "true");
  vi.mocked(requireStudioAccess).mockResolvedValue({
    db,
    user: { id: "pilot" },
  } as Awaited<ReturnType<typeof requireStudioAccess>>);
  vi.mocked(createStudioQuote).mockResolvedValue({
    id: "quote",
  } as Awaited<ReturnType<typeof createStudioQuote>>);
  vi.mocked(generateStudioGeminiImage).mockResolvedValue({
    bytes: image,
    mime: "image/jpeg",
  });

  await expect(
    generateStudioImageNow({
      tenant_id: tenant,
      design_id: design,
      asset_id: asset,
      operation: "style",
      quality: "economy",
      idempotency_key: lease,
    }),
  ).resolves.toMatchObject({
    status: "succeeded",
    result_asset_id: jobId,
    result_url: `/api/studio/assets/${jobId}/file?tenant_id=${tenant}`,
  });
  expect(finish).toHaveBeenCalledExactlyOnceWith({
    p_job_id: jobId,
    p_lease_token: lease,
    p_asset_id: jobId,
    p_error: null,
  });
});
