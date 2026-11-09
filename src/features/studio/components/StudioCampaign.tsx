import { resolveStudioArtworkBatch } from "../services/studioPlacementService";
import { StudioArtworkView } from "./StudioArtworkView";
export async function StudioCampaign({
  tenantId,
  sourceId,
  surface = "store_home_campaign",
}: {
  tenantId: string;
  sourceId?: string;
  surface?: "store_home_campaign" | "product_campaign";
}) {
  const artwork = await resolveStudioArtworkBatch(
      tenantId,
      "public_store",
      surface,
      sourceId ? [sourceId] : undefined,
    ),
    image = artwork.get(sourceId ?? "campaign");
  return image ? (
    <section aria-label="Campaña del negocio">
      <StudioArtworkView artwork={image} />
    </section>
  ) : null;
}
