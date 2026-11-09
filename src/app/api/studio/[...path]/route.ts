import { handleStudioRequest } from "@/features/studio/services/studioHttpService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleStudioRequest(request, (await context.params).path);
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
