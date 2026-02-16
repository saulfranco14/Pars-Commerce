import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
          background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
          borderRadius: "8px",
          fontSize: 20,
          fontWeight: 700,
          color: "white",
        }}
      >
        P
      </div>
    ),
    { ...size }
  );
}
