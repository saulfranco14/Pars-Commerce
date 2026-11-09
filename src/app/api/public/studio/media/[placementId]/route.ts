import { getPublicStudioFile } from "@/features/studio/services/studioPlacementService";
import { uuidSchema } from "@/features/studio/validations/studioSchemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
async function handle(
  request: Request,
  context: { params: Promise<{ placementId: string }> },
) {
  const id = uuidSchema.safeParse((await context.params).placementId);
  if (!id.success)
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  try {
    return await getPublicStudioFile(id.data, request.method === "HEAD");
  } catch {
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
export { handle as GET, handle as HEAD };
