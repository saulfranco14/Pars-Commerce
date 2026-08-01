import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Icono de app: la moneda de Tlaco sobre el navy de marca. A este tamaño sí
 * entra la mitad más oscura (náhuatl `tlacotl` = "mitad"), que es el detalle
 * que se pierde en el favicon de 32px.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f1c33",
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: "50%",
            background: "#e8a33d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Mitad derecha en el tono profundo del canto. */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 66,
              height: 132,
              background: "#c07f22",
            }}
          />
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#0f1c33",
              zIndex: 1,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
