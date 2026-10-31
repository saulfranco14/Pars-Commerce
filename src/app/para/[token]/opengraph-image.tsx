import { ImageResponse } from "next/og";

import { getParaPage } from "@/features/growth/services/paraService";

export const alt = "Tienda de ejemplo preparada por Tlaco";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0f1c33";
const ACCENT = "#3483fa";
const COIN = "#e8a33d";
const BG = "#f7f9fc";

/** Card under the link in WhatsApp: the business's own name, so it reads as made for them. */
export default async function ParaOpengraphImage({ params }: { params: { token: string } }) {
  const data = await getParaPage(params.token);
  const name = data?.businessName ?? "Su negocio";
  const offer = data?.kind === "offer" ? data : null;
  const detail = data?.kind === "store" ? [data.giroLabel, data.place].filter(Boolean).join(" · ") : offer?.title ?? "";
  const brand = offer?.workspaceName ?? null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: BG, padding: "64px 72px", fontFamily: "sans-serif" }}>
        {brand ? (
          <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: INK, letterSpacing: -2 }}>{brand}</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", fontSize: 48, fontWeight: 800, color: INK, letterSpacing: -2 }}>
            Tlac
            <div style={{ width: 36, height: 36, marginLeft: 2, marginTop: 8, borderRadius: 999, background: COIN, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 14, height: 14, borderRadius: 999, background: INK }} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: ACCENT }}>{brand ? "Propuesta para" : "Tienda de ejemplo para"}</div>
          <div style={{ fontSize: name.length > 28 ? 64 : 84, fontWeight: 800, color: INK, lineHeight: 1.02, letterSpacing: -3, marginTop: 12 }}>{name}</div>
          {detail ? <div style={{ fontSize: 30, color: "#5a6378", marginTop: 18 }}>{detail}</div> : null}
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {(brand ? ["Propuesta privada"] : ["Pedidos por celular", "Pago sin terminal", "Gratis"]).map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "12px 22px",
                borderRadius: 999,
                border: `2px solid ${label === "Gratis" ? ACCENT : "#d9e1ee"}`,
                background: label === "Gratis" ? ACCENT : "#ffffff",
                color: label === "Gratis" ? "#ffffff" : INK,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
