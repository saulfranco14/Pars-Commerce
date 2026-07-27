import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon: la moneda de Tlaco suelta — la misma pieza que hace de "o" en el
 * logotipo. A 32px va lisa (sin la mitad en dos tonos): a ese tamaño el
 * segundo tono se convierte en ruido y la moneda pierde forma.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e8a33d",
          borderRadius: "50%",
        }}
      >
        {/* El contrapunzón: lo que la vuelve una "o" y no un punto. */}
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#0f1c33",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
