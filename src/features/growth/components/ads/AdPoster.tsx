import { AD_ICON_NODES } from "@/features/growth/constants/adIcons";
import { AD_HEIGHT, AD_MARK_TEXT, AD_WIDTH } from "@/features/growth/constants/prospectAds";
import { formatAdPrice, headlineScale } from "@/features/growth/helpers/prospectAds";

import type { AdContent, AdIconKey, AdPosterProps } from "@/features/growth/interfaces/prospectAds";

// Inline styles and display:flex everywhere: the same markup is drawn by the browser and by next/og (satori).
const TONES: Record<AdContent["tone"], { background: string; ink: string; soft: string; pill: string }> = {
  teal: { background: "radial-gradient(120% 90% at 85% 5%, #2dd4bf 0%, #0f766e 45%, #042f2e 100%)", ink: "#ffffff", soft: "rgba(255,255,255,0.14)", pill: "rgba(255,255,255,0.18)" },
  blue: { background: "linear-gradient(160deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)", ink: "#ffffff", soft: "rgba(255,255,255,0.14)", pill: "rgba(255,255,255,0.18)" },
  gold: { background: "linear-gradient(170deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)", ink: "#2a1503", soft: "rgba(255,255,255,0.55)", pill: "rgba(42,21,3,0.12)" },
  amber: { background: "radial-gradient(120% 90% at 80% 10%, #f59e0b 0%, #b45309 40%, #3b1a06 100%)", ink: "#ffffff", soft: "rgba(255,255,255,0.14)", pill: "rgba(255,255,255,0.18)" },
};
const PHOTO_SHADE = "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.82) 100%)";
const MARK_HEIGHT = 92;

export function AdIcon({ icon, size, color }: { icon: AdIconKey; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {AD_ICON_NODES[icon].map(([tag, attrs], index) =>
        tag === "path" ? <path key={index} d={(attrs as { d: string }).d} /> : <circle key={index} {...(attrs as { cx: string; cy: string; r: string })} fill={(attrs as { fill?: string }).fill ? color : "none"} />,
      )}
    </svg>
  );
}

/** One 4:5 ad. `width` scales every size from the 1080 px design. */
export function AdPoster({ ad, width, mark, fontFamily }: AdPosterProps) {
  const s = width / AD_WIDTH;
  const px = (value: number) => Math.round(value * s * 10) / 10;
  const tone = TONES[ad.tone];
  const photo = Boolean(ad.backgroundUrl);
  const ink = photo ? "#ffffff" : tone.ink;
  const pill = photo ? "rgba(255,255,255,0.2)" : tone.pill;
  const big = ad.kind === "name";
  const headlineSize = px((big ? 132 : 108) * headlineScale(ad.headline));
  const bodyHeight = AD_HEIGHT - (mark ? MARK_HEIGHT : 0);

  return (
    <div style={{ width: px(AD_WIDTH), height: px(AD_HEIGHT), display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", background: photo ? "#111827" : tone.background, color: ink, fontFamily }}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/og needs a plain img, and the browser shows the same markup.
        <img src={ad.backgroundUrl as string} alt="" width={px(AD_WIDTH)} height={px(bodyHeight)} style={{ position: "absolute", top: 0, left: 0, width: px(AD_WIDTH), height: px(bodyHeight), objectFit: "cover" }} />
      ) : null}
      {photo ? <div style={{ position: "absolute", top: 0, left: 0, width: px(AD_WIDTH), height: px(bodyHeight), display: "flex", backgroundImage: PHOTO_SHADE }} /> : null}

      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: px(AD_WIDTH), height: px(bodyHeight), padding: px(76) }}>
        {ad.kind === "promo" ? (
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", fontSize: px(42), fontWeight: 800, letterSpacing: px(5), textTransform: "uppercase", padding: `${px(14)}px ${px(34)}px`, borderRadius: px(999), background: pill }}>{ad.eyebrow}</div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: px(44), fontWeight: 800, letterSpacing: px(6), textTransform: "uppercase", opacity: 0.94, lineHeight: 1.2 }}>{ad.eyebrow}</div>
        )}

        {photo ? (
          <div style={{ display: "flex", flexGrow: 1 }} />
        ) : (
          <div style={{ display: "flex", alignSelf: "center", alignItems: "center", justifyContent: "center", width: px(380), height: px(380), borderRadius: px(999), background: tone.soft }}>
            <AdIcon icon={ad.icon} size={px(210)} color={ink} />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: headlineSize, fontWeight: 800, lineHeight: 1.02, letterSpacing: px(-2) }}>{ad.headline}</div>
          {ad.price ? <div style={{ display: "flex", fontSize: px(220), fontWeight: 800, lineHeight: 0.95, letterSpacing: px(-8), marginTop: px(8) }}>{formatAdPrice(ad.price)}</div> : null}
          {ad.detail ? <div style={{ display: "flex", fontSize: px(46), fontWeight: 600, opacity: 0.92, marginTop: px(20), lineHeight: 1.25 }}>{ad.detail}</div> : null}
          {ad.cta ? (
            <div style={{ display: "flex", marginTop: px(36) }}>
              <div style={{ display: "flex", alignItems: "center", fontSize: px(44), fontWeight: 800, padding: `${px(18)}px ${px(40)}px`, borderRadius: px(999), background: pill }}>
                {ad.kind === "promo" ? <AdIcon icon="tag" size={px(44)} color={ink} /> : null}
                <div style={{ display: "flex", marginLeft: ad.kind === "promo" ? px(14) : 0 }}>{ad.cta}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {mark ? (
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: px(AD_WIDTH), height: px(MARK_HEIGHT), background: "#0b1020", color: "#ffffff", fontSize: px(38), fontWeight: 600, letterSpacing: px(1) }}>
          {AD_MARK_TEXT}
        </div>
      ) : null}
    </div>
  );
}
