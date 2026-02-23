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
          borderRadius: "50%",
          fontSize: 14,
          fontWeight: 700,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        PC
      </div>
    ),
    { ...size }
  );
}
