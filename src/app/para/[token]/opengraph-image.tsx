import { ImageResponse } from "next/og";

import { buildLeadAds } from "@/features/growth/helpers/prospectAds";
import { renderAdCard } from "@/features/growth/services/adImageService";
import { getParaPage } from "@/features/growth/services/paraService";

export const runtime = "nodejs";
export const alt = "Anuncios de regalo preparados por Tlaco";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0f1c33";
const BG = "#f7f9fc";

/** Card under the link in WhatsApp: the prospect's own product ad, so the link already looks like a gift. */
export default async function ParaOpengraphImage({ params }: { params: { token: string } }) {
  const data = await getParaPage(params.token);
  if (data?.kind === "ads") {
    const product = buildLeadAds(data.source)[3];
    return renderAdCard(product, data.displayName ?? `Su ${data.giroLabel.toLowerCase()}`, "Anuncios hechos para");
  }
  const title = data?.kind === "offer" ? `${data.workspaceName} · Propuesta para ${data.businessName}` : "Anuncios de regalo · Tlaco";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: BG, padding: "64px 72px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, color: INK, lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
      </div>
    ),
    { ...size },
  );
}
