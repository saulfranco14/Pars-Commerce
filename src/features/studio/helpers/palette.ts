import { STUDIO_DEFAULT_PALETTE } from "../constants/designs";
import type { StudioPhotoPalette } from "../interfaces/scene";

type Rgb = [number, number, number];

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

export function hexToRgb(hex: string): Rgb {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
}

export function rgbToHex(color: Rgb): string {
  return `#${color
    .map((v) =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function luminance(color: Rgb): number {
  const [r, g, b] = color.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const x = luminance(hexToRgb(a)),
    y = luminance(hexToRgb(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb =>
  a.map((v, i) => v + (b[i] - v) * t) as Rgb;

function toHsl([r, g, b]: Rgb): Rgb {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255],
    max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn),
    l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min,
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min),
    h =
      max === rn
        ? (gn - bn) / d + (gn < bn ? 6 : 0)
        : max === gn
          ? (bn - rn) / d + 2
          : (rn - gn) / d + 4;
  return [h / 6, s, l];
}

function fromHsl([h, s, l]: Rgb): Rgb {
  const f = (n: number) => {
    const k = (n + h * 12) % 12,
      a = s * Math.min(l, 1 - l);
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

/**
 * Picks the photo's own dark, light and strong tones from RGBA pixels: the most
 * common dark color for shades, the most common light one for bands, and the
 * most common saturated one for the price stamp.
 */
export function studioPaletteFromPixels(
  data: Uint8ClampedArray,
  photo: string,
): StudioPhotoPalette {
  const buckets = new Map<number, { n: number; sum: Rgb }>();
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const key = ((data[i] >> 5) << 6) | ((data[i + 1] >> 5) << 3) | (data[i + 2] >> 5),
      entry = buckets.get(key) ?? { n: 0, sum: [0, 0, 0] as Rgb };
    entry.n++;
    entry.sum[0] += data[i];
    entry.sum[1] += data[i + 1];
    entry.sum[2] += data[i + 2];
    buckets.set(key, entry);
  }
  const colors = [...buckets.values()].map((e) => {
    const rgb = e.sum.map((v) => v / e.n) as Rgb;
    return { rgb, n: e.n, hsl: toHsl(rgb) };
  });
  const best = (
    keep: (c: (typeof colors)[number]) => boolean,
    score: (c: (typeof colors)[number]) => number,
  ) => colors.filter(keep).sort((a, b) => score(b) - score(a))[0];
  if (!colors.length) return { photo, ...STUDIO_DEFAULT_PALETTE };
  const dark = best((c) => c.hsl[2] < 0.32, (c) => c.n)?.rgb ?? hexToRgb(STUDIO_DEFAULT_PALETTE.dark),
    light = best((c) => c.hsl[2] > 0.62, (c) => c.n)?.rgb ?? hexToRgb(STUDIO_DEFAULT_PALETTE.light),
    strong = best(
      (c) => c.hsl[2] > 0.3 && c.hsl[2] < 0.72,
      (c) => c.n * c.hsl[1] ** 2,
    );
  const accent = strong
    ? fromHsl([
        strong.hsl[0],
        Math.max(strong.hsl[1], 0.62),
        Math.min(Math.max(strong.hsl[2], 0.45), 0.56),
      ])
    : hexToRgb(STUDIO_DEFAULT_PALETTE.accent);
  return {
    photo,
    dark: rgbToHex(dark),
    light: rgbToHex(mix(light, [251, 245, 234], 0.55)),
    accent: rgbToHex(accent),
  };
}

export interface StudioDesignColors {
  /** Shade tint and the ground behind photo designs. */
  dark: string;
  /** Ground of the band and card designs. */
  light: string;
  /** Text on the light ground. */
  ink: string;
  /** Fill of the price stamp or chip. */
  accent: string;
  /** Text on the accent fill. */
  onAccent: string;
  /** The accent darkened until it reads as text on the light ground. */
  accentInk: string;
}

/** Turns photo tones into colors that always read: each pair passes WCAG contrast. */
export function studioDesignColors(
  palette?: Omit<StudioPhotoPalette, "photo">,
): StudioDesignColors {
  const source = palette ?? STUDIO_DEFAULT_PALETTE;
  let dark = hexToRgb(source.dark),
    light = hexToRgb(source.light);
  const accent = hexToRgb(source.accent);
  while (luminance(dark) > 0.025) dark = mix(dark, [6, 8, 14], 0.25);
  while (luminance(light) < 0.78) light = mix(light, [252, 248, 240], 0.3);
  let ink = mix(dark, BLACK, 0.2);
  while (contrastRatio(rgbToHex(ink), rgbToHex(light)) < 8)
    ink = mix(ink, BLACK, 0.3);
  const onAccent =
    contrastRatio(rgbToHex(accent), "#ffffff") >=
    contrastRatio(rgbToHex(accent), rgbToHex(ink))
      ? WHITE
      : ink;
  let accentInk = accent;
  while (contrastRatio(rgbToHex(accentInk), rgbToHex(light)) < 4.5)
    accentInk = mix(accentInk, BLACK, 0.15);
  return {
    dark: rgbToHex(dark),
    light: rgbToHex(light),
    ink: rgbToHex(ink),
    accent: rgbToHex(accent),
    onAccent: rgbToHex(onAccent),
    accentInk: rgbToHex(accentInk),
  };
}
