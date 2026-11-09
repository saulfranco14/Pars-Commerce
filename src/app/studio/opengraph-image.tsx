import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Tlaco Studio: crea anuncios para tu negocio con tu foto, tu precio y tu marca.";
export default async function Image() {
  const photo = await readFile(
    join(process.cwd(), "public/landing/comida-hero.png"),
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#111827",
          color: "#ffffff",
          padding: 60,
          fontFamily: "sans-serif",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 660 }}>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#7bb1ff",
              fontWeight: 700,
            }}
          >
            Tlaco Studio
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -4,
              marginTop: 34,
            }}
          >
            Crea anuncios para tu negocio.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 25,
              color: "#b9c6da",
              marginTop: 28,
            }}
          >
            Tu foto. Tu precio. Toda tu personalidad.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 23,
              marginTop: 44,
              color: "#7bb1ff",
            }}
          >
            tlaco.app/studio
          </div>
        </div>
        <div
          style={{
            display: "flex",
            position: "relative",
            width: 325,
            height: 440,
            borderRadius: 18,
            overflow: "hidden",
            transform: "rotate(5deg)",
            background: "#172033",
          }}
        >
          {/* A fixed repository image is embedded so OG rendering needs no external request. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${photo.toString("base64")}`}
            alt=""
            width={325}
            height={440}
            style={{
              position: "absolute",
              objectFit: "cover",
              objectPosition: "70% center",
            }}
          />
          <div
            style={{
              display: "flex",
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(9,16,29,.8), rgba(9,16,29,.1) 55%, rgba(9,16,29,.95))",
            }}
          />
          <div
            style={{
              display: "flex",
              position: "absolute",
              inset: 0,
              padding: 25,
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", fontSize: 13, letterSpacing: 2 }}>
              LA TAQUERÍA · EJEMPLO
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 49,
                fontWeight: 700,
                lineHeight: 1,
                marginTop: 25,
              }}
            >
              Hoy se antoja.
            </div>
            <div style={{ display: "flex", fontSize: 16, marginTop: "auto" }}>
              5 tacos + agua fresca
            </div>
            <div style={{ display: "flex", fontSize: 63, fontWeight: 700 }}>
              $99
            </div>
            <div style={{ display: "flex", fontSize: 11, color: "#cbd5e1" }}>
              Precio ilustrativo
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
