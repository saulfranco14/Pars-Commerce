import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { AdPoster } from "@/features/growth/components/ads/AdPoster";
import { AD_HEIGHT, AD_WIDTH } from "@/features/growth/constants/prospectAds";

import type { AdContent } from "@/features/growth/interfaces/prospectAds";

const FONT_DIR = join(process.cwd(), "src/features/growth/assets/fonts");
const FONT_FAMILY = "Inter Tight";

let fonts: Promise<Array<{ name: string; data: Buffer; weight: 600 | 800; style: "normal" }>> | null = null;

function loadFonts() {
  fonts ??= Promise.all(
    ([600, 800] as const).map(async (weight) => ({ name: FONT_FAMILY, data: await readFile(join(FONT_DIR, `InterTight-${weight}.ttf`)), weight, style: "normal" as const })),
  ).catch((error) => {
    fonts = null;
    throw error;
  });
  return fonts;
}

/** The ad as a PNG the size of a WhatsApp Estado; `mark` adds the «Muestra gratis» band. */
export async function renderAdPng(ad: AdContent, options: { mark: boolean; fileName: string; download?: boolean }): Promise<Response> {
  const image = new ImageResponse(<AdPoster ad={ad} width={AD_WIDTH} mark={options.mark} fontFamily={FONT_FAMILY} />, {
    width: AD_WIDTH,
    height: AD_HEIGHT,
    fonts: await loadFonts(),
    headers: {
      "Cache-Control": "private, no-store",
      ...(options.download ? { "Content-Disposition": `attachment; filename="${options.fileName}"` } : {}),
    },
  });
  return image;
}

/** Social card (1200×630) for the link preview: the product ad next to the business name. */
export async function renderAdCard(ad: AdContent, title: string, subtitle: string): Promise<ImageResponse> {
  const posterWidth = 432;
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", alignItems: "center", background: "#0b1020", fontFamily: FONT_FAMILY, padding: "0 72px", color: "#ffffff" }}>
        <div style={{ display: "flex", borderRadius: 28, overflow: "hidden", width: posterWidth, height: (posterWidth * AD_HEIGHT) / AD_WIDTH, marginTop: 40 }}>
          <AdPoster ad={ad} width={posterWidth} mark={false} fontFamily={FONT_FAMILY} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 64, flex: 1 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 600, color: "#9db8ff" }}>{subtitle}</div>
          <div style={{ display: "flex", fontSize: title.length > 26 ? 60 : 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, marginTop: 14 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 34 }}>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 800, padding: "12px 26px", borderRadius: 999, background: "#2563eb" }}>Sin costo · Tlaco</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await loadFonts() },
  );
}
