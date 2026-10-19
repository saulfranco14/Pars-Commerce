import { ImageResponse } from "next/og";

export const alt = "Tlaco: tu cliente pide y paga desde su celular y tú lo ves al instante";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0f1c33";
const ACCENT = "#3483fa";
const COIN = "#e8a33d";
const BG = "#f7f9fc";

/**
 * Vista previa al compartir la home (WhatsApp, Facebook, anuncios). En un
 * chat se ve a ~300px de ancho: el mensaje tiene que leerse a ese tamaño.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BG,
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 52, fontWeight: 800, color: INK, letterSpacing: -2 }}>
            Tlac
            <div
              style={{
                width: 40,
                height: 40,
                marginLeft: 2,
                marginTop: 8,
                borderRadius: 999,
                background: COIN,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 16, height: 16, borderRadius: 999, background: INK }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 68, fontWeight: 800, color: INK, lineHeight: 1.05, letterSpacing: -2 }}>
              Tu cliente pide y paga desde su celular.
            </div>
            <div style={{ fontSize: 68, fontWeight: 800, color: ACCENT, lineHeight: 1.05, letterSpacing: -2, marginTop: 8 }}>
              Tú lo ves al instante.
            </div>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            {["Mesas con QR", "Tienda en línea", "Cuotas y crédito", "Empieza gratis"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: "12px 22px",
                  borderRadius: 999,
                  border: `2px solid ${label === "Empieza gratis" ? ACCENT : "#d9e1ee"}`,
                  background: label === "Empieza gratis" ? ACCENT : "#ffffff",
                  color: label === "Empieza gratis" ? "#ffffff" : INK,
                  fontSize: 26,
                  fontWeight: 700,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
