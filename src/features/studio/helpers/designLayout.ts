import type { StudioDesignColors } from "./palette";
import type { StudioDesignId, StudioNode } from "../interfaces/scene";

export type StudioDesignKey =
  | "image"
  | "shade"
  | "plate"
  | "frame"
  | "logo"
  | "brand"
  | "phrase"
  | "name"
  | "price"
  | "badge"
  | "tagline"
  | "period"
  | "conditions"
  | "validity";

export interface StudioDesignPlacement {
  box?: Pick<StudioNode, "x" | "y" | "width" | "height">;
  /** Final size as a share of the canvas height. */
  fontSize?: number;
  style?: Partial<StudioNode>;
}

export interface StudioDesignInput {
  layout: StudioDesignId;
  width: number;
  height: number;
  logo: boolean;
  brand: string;
  phrase: string;
  /** Product name shown as the detail line when the phrase is something else. */
  name: string | null;
  offer: { key: "price" | "badge"; text: string; cta: boolean } | null;
  /** Closing lines in order: a second badge, the tagline, validity, period, conditions. */
  notes: Array<{ key: StudioDesignKey; text: string }>;
  colors: StudioDesignColors;
}

export interface StudioDesignResult {
  background: string;
  placements: Partial<Record<StudioDesignKey, StudioDesignPlacement>>;
}

/* Everything below is measured in units of the canvas's shorter side, so a design keeps its proportions in every format. */
const PAD = 0.07;
const LOGO = 0.075;
/** Gap to the canvas edge for stamps, pills and logos; keeps them in the safe area of a wide banner too. */
const EDGE = 0.06;
const STAMP_TILT = -8;
/** Average glyph width per font size for Inter Tight, on the safe side so a box never drops a line. */
const GLYPH = { heavy: 0.6, price: 0.62, caps: 0.84, text: 0.56, note: 0.82 };

const HEAVY: Partial<StudioNode> = {
  fontFamily: "Inter Tight",
  fontStyle: "bold",
  letterSpacing: -0.03,
  lineHeight: 0.91,
  caps: false,
  align: "left",
  rotation: 0,
  strokeWidth: 0,
  shadowBlur: 0,
  opacity: 1,
  visible: true,
};
const CAPS: Partial<StudioNode> = {
  ...HEAVY,
  letterSpacing: 0.12,
  lineHeight: 1.15,
  caps: true,
};
const TEXT: Partial<StudioNode> = {
  ...HEAVY,
  fontStyle: "normal",
  letterSpacing: 0,
  lineHeight: 1.15,
};
const NOTE: Partial<StudioNode> = { ...TEXT, letterSpacing: 0.13, caps: true };
const PRICE: Partial<StudioNode> = { ...HEAVY, lineHeight: 1 };

function lineCount(text: string, width: number, font: number, glyph: number) {
  const perLine = Math.max(1, Math.floor(width / (font * glyph)));
  let lines = 0;
  for (const paragraph of text.split("\n")) {
    let used = 0;
    lines++;
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (used && used + 1 + word.length <= perLine) {
        used += 1 + word.length;
        continue;
      }
      if (used) lines++;
      used = word.length;
      while (used > perLine) {
        lines++;
        used -= perLine;
      }
    }
  }
  return lines;
}

/** Shrinks a heavy block until it fits in `maxLines`. */
function fitBlock(text: string, width: number, base: number, maxLines: number, min: number) {
  let font = base,
    lines = lineCount(text, width, font, GLYPH.heavy);
  while (lines > maxLines && font > min) {
    font = Math.max(min, font * 0.92);
    lines = lineCount(text, width, font, GLYPH.heavy);
  }
  return { font, height: lines * font * 0.91 + font * 0.2 };
}

const fitLine = (text: string, width: number, base: number, glyph: number) =>
  Math.min(base, width / (Math.max(1, text.length) * glyph));
const textWidth = (text: string, font: number, glyph: number) =>
  text.length * font * glyph;
const lineHeight = (font: number) => font * 1.3;

export function arrangeStudioDesign(input: StudioDesignInput): StudioDesignResult {
  const m = Math.min(input.width, input.height),
    W = input.width / m,
    H = input.height / m,
    wide = W > 1.3,
    col = wide ? Math.min(W - PAD * 2, 1.2) : W - PAD * 2,
    c = input.colors,
    placements: StudioDesignResult["placements"] = {};
  const put = (
    key: StudioDesignKey,
    x: number,
    y: number,
    w: number,
    h: number,
    font?: number,
    style: Partial<StudioNode> = {},
  ) => {
    placements[key] = {
      box: { x: x / W, y: y / H, width: w / W, height: h / H },
      fontSize: font === undefined ? undefined : font / H,
      style: { visible: true, ...style },
    };
  };
  const hide = (key: StudioDesignKey) => {
    placements[key] = { style: { visible: false } };
  };
  const offerFont = (base: number, width: number) =>
    input.offer
      ? fitLine(input.offer.text, width, input.offer.cta ? Math.min(base, 0.07) : base, GLYPH.price)
      : 0;
  const putOffer = (x: number, y: number, w: number, font: number, style: Partial<StudioNode>) => {
    if (input.offer) put(input.offer.key, x, y, w, font * 1.08, font, { ...PRICE, ...style });
  };
  const brandRow = (x: number, y: number, maxWidth: number, color: string) => {
    let start = x;
    if (input.logo) {
      put("logo", x, y, LOGO, LOGO);
      start = x + LOGO + 0.024;
    }
    if (!input.brand) return;
    const width = Math.max(0.1, maxWidth - (start - x)),
      font = fitLine(input.brand, width, 0.028, GLYPH.caps);
    put("brand", start, y + (LOGO - lineHeight(font)) / 2, width, lineHeight(font), font, { ...CAPS, color });
  };
  /** Stacks closing lines upward from `bottom`; returns the new top. */
  const notesUp = (
    notes: StudioDesignInput["notes"],
    x: number,
    bottom: number,
    w: number,
    style: Partial<StudioNode>,
  ) => {
    let y = bottom;
    for (const note of [...notes].reverse()) {
      const conditions = note.key === "conditions",
        font = fitLine(note.text, w, conditions ? 0.021 : 0.023, conditions ? GLYPH.text : GLYPH.note);
      y -= lineHeight(font);
      put(note.key, x, y, w, lineHeight(font), font, {
        ...(conditions ? TEXT : NOTE),
        ...style,
      });
    }
    return y;
  };
  const notesDown = (
    notes: StudioDesignInput["notes"],
    x: number,
    top: number,
    w: number,
    style: Partial<StudioNode>,
  ) => {
    let y = top;
    for (const note of notes) {
      const conditions = note.key === "conditions",
        font = fitLine(note.text, w, conditions ? 0.021 : 0.023, conditions ? GLYPH.text : GLYPH.note);
      put(note.key, x, y, w, lineHeight(font), font, {
        ...(conditions ? TEXT : NOTE),
        ...style,
      });
      y += lineHeight(font);
    }
    return y;
  };
  const photo = (radius = 0) => ({ radius, opacity: 1, visible: true, rotation: 0 });
  const white = "#ffffff";
  hide("frame");

  if (input.layout === "impact") {
    put("image", 0, 0, W, H, undefined, photo());
    put("shade", 0, 0, W, H, undefined, { shade: "poster", fill: c.dark, opacity: 1 });
    hide("plate");
    if (input.logo) put("logo", W - PAD - LOGO, PAD, LOGO, LOGO);
    if (input.brand) {
      const width = col - (input.logo ? LOGO + 0.03 : 0),
        font = fitLine(input.brand, width, 0.028, GLYPH.caps);
      put("brand", PAD, PAD + (LOGO - lineHeight(font)) / 2, width, lineHeight(font), font, { ...CAPS, color: white });
    }
    const phrase = fitBlock(input.phrase, col, 0.13, 3, 0.08);
    put("phrase", PAD, PAD + LOGO + 0.04, col, phrase.height, phrase.font, { ...HEAVY, color: white });
    let y = notesUp(input.notes, PAD, H - PAD, col, { color: white }) - 0.012;
    const offer = offerFont(0.12, col);
    y -= offer * 1.08;
    putOffer(PAD, y, col, offer, { color: white });
    if (input.name) {
      const font = fitLine(input.name, col, 0.034, GLYPH.text);
      put("name", PAD, y - lineHeight(font) - 0.004, col, lineHeight(font), font, { ...TEXT, color: white });
    } else hide("name");
    return { background: c.dark, placements };
  }

  if (input.layout === "band") {
    const bandTop = H - 0.36,
      inner = W - 0.12;
    put("image", 0, 0, W, bandTop, undefined, photo());
    hide("shade");
    hide("name");
    if (input.logo) put("logo", W - EDGE - LOGO, EDGE, LOGO, LOGO);
    if (input.brand) {
      const font = fitLine(input.brand, W * 0.55, 0.025, GLYPH.caps),
        text = Math.min(textWidth(input.brand, font, GLYPH.caps), W * 0.55),
        pill = lineHeight(font) + 0.026;
      put("plate", EDGE, EDGE, text + 0.06, pill, undefined, { fill: c.light, radius: 0.5, opacity: 1, shadowBlur: 0 });
      put("brand", EDGE + 0.03, EDGE + (pill - lineHeight(font)) / 2, text + 0.01, lineHeight(font), font, { ...CAPS, color: c.ink });
    } else hide("plate");
    const rightW = inner * 0.4,
      offer = offerFont(0.12, rightW),
      notesH = input.notes.reduce((sum, n) => sum + lineHeight(fitLine(n.text, rightW, 0.022, GLYPH.note)), 0),
      blockH = offer * 1.08 + notesH,
      top = bandTop + (H - bandTop - blockH) / 2;
    putOffer(W - 0.06 - rightW, top, rightW, offer, { color: c.accentInk, align: "right" });
    notesDown(input.notes, W - 0.06 - rightW, top + offer * 1.08, rightW, { color: c.ink, align: "right" });
    const leftW = inner - rightW - 0.04,
      phrase = fitBlock(input.phrase, leftW, 0.086, 2, 0.05);
    put("phrase", 0.06, bandTop + (H - bandTop - phrase.height) / 2, leftW, phrase.height, phrase.font, { ...HEAVY, color: c.ink });
    return { background: c.light, placements };
  }

  if (input.layout === "stamp") {
    const D = 0.33,
      cx = W - EDGE - D / 2,
      cy = EDGE + D / 2,
      tilt = (STAMP_TILT * Math.PI) / 180;
    put("image", 0, 0, W, H, undefined, photo());
    put("shade", 0, 0, W, H, undefined, { shade: "bottom", fill: c.dark, opacity: 1 });
    brandRow(PAD, PAD, W - D - EDGE - 0.03 - PAD, white);
    if (!input.offer && !input.notes.length) hide("plate");
    else put("plate", W - EDGE - D, EDGE, D, D, undefined, {
      fill: c.accent,
      radius: 0.5,
      opacity: 1,
      shadowColor: "#000000",
      shadowBlur: 24,
      shadowOffsetX: 0,
      shadowOffsetY: 8,
    });
    /* Texts in the stamp turn with it around its center. */
    const turn = (key: StudioDesignKey, x: number, y: number, w: number, h: number, font: number, style: Partial<StudioNode>) => {
      const dx = x - cx,
        dy = y - cy;
      put(
        key,
        cx + dx * Math.cos(tilt) - dy * Math.sin(tilt),
        cy + dx * Math.sin(tilt) + dy * Math.cos(tilt),
        w,
        h,
        font,
        { ...style, rotation: STAMP_TILT },
      );
    };
    const [first, ...rest] = input.notes,
      offer = offerFont(0.12, D * 0.78),
      noteFont = first ? fitLine(first.text, D * 0.7, 0.024, GLYPH.note) : 0,
      total = offer * 1.05 + (first ? lineHeight(noteFont) : 0),
      top = cy - total / 2;
    if (input.offer)
      turn(input.offer.key, cx - D * 0.42, top, D * 0.84, offer * 1.08, offer, { ...PRICE, color: c.onAccent, align: "center" });
    if (first)
      turn(first.key, cx - D * 0.42, top + offer * 1.05, D * 0.84, lineHeight(noteFont), noteFont, { ...NOTE, color: c.onAccent, align: "center" });
    let y = notesUp(rest, PAD, H - PAD, col, { color: white });
    if (input.name) {
      const font = fitLine(input.name, col, 0.034, GLYPH.text);
      y -= lineHeight(font) + 0.006;
      put("name", PAD, y, col, lineHeight(font), font, { ...TEXT, color: white });
    } else hide("name");
    const phrase = fitBlock(input.phrase, col, 0.115, 3, 0.075);
    put("phrase", PAD, y - phrase.height - 0.01, col, phrase.height, phrase.font, { ...HEAVY, color: white });
    return { background: c.dark, placements };
  }

  if (input.layout === "statement") {
    put("image", 0, 0, W, H, undefined, photo());
    put("shade", 0, 0, W, H, undefined, { shade: "center", fill: c.dark, opacity: 1 });
    hide("name");
    const brandFont = input.brand ? fitLine(input.brand, W * 0.6, 0.028, GLYPH.caps) : 0,
      brandW = input.brand ? Math.min(textWidth(input.brand, brandFont, GLYPH.caps), W * 0.6) : 0,
      rowW = (input.logo ? LOGO + (input.brand ? 0.024 : 0) : 0) + brandW;
    brandRow((W - rowW) / 2, 0.06, rowW + 0.02, white);
    const phrase = fitBlock(input.phrase, W - 0.12, 0.155, 3, 0.09);
    put("phrase", 0.06, (H - phrase.height) / 2, W - 0.12, phrase.height, phrase.font, { ...HEAVY, color: white, align: "center" });
    const [first, ...rest] = input.notes,
      offer = input.offer ? fitLine(input.offer.text, W * 0.5, 0.042, GLYPH.price) : 0,
      offerW = input.offer ? textWidth(input.offer.text, offer, GLYPH.price) : 0,
      noteFont = first ? fitLine(first.text, W * 0.4, 0.024, GLYPH.note) : 0,
      noteW = first ? textWidth(first.text, noteFont, GLYPH.note) : 0,
      gap = input.offer && first ? 0.03 : 0,
      pillW = offerW + gap + noteW + 0.09,
      pillH = Math.max(offer * 1.1, lineHeight(noteFont)) + 0.03,
      px = (W - pillW) / 2,
      py = H - 0.07 - pillH;
    if (input.offer || first) {
      put("plate", px, py, pillW, pillH, undefined, { fill: c.dark, radius: 0.5, opacity: 0.6, shadowBlur: 0 });
      if (input.offer) put(input.offer.key, px + 0.045, py + (pillH - offer * 1.1) / 2, offerW + 0.01, offer * 1.1, offer, { ...PRICE, color: white });
      if (first)
        put(first.key, px + 0.045 + offerW + gap, py + (pillH - lineHeight(noteFont)) / 2, noteW + 0.02, lineHeight(noteFont), noteFont, { ...NOTE, color: white });
    } else hide("plate");
    notesUp(rest, 0.06, py - 0.02, W - 0.12, { color: white, align: "center" });
    return { background: c.dark, placements };
  }

  if (input.layout === "top") {
    put("image", 0, 0, W, H, undefined, photo());
    put("shade", 0, 0, W, H, undefined, { shade: "top", fill: c.dark, opacity: 1 });
    brandRow(PAD, PAD, col, white);
    const phrase = fitBlock(input.phrase, col, 0.105, 3, 0.07),
      phraseTop = PAD + LOGO + 0.035;
    put("phrase", PAD, phraseTop, col, phrase.height, phrase.font, { ...HEAVY, color: white });
    let y = phraseTop + phrase.height + 0.025;
    if (input.offer) {
      const font = offerFont(0.08, col * 0.5),
        chipW = textWidth(input.offer.text, font, GLYPH.price) + 0.06,
        chipH = font * 1.1 + 0.024;
      put("plate", PAD, y, chipW, chipH, undefined, { fill: c.accent, radius: 0.024 / Math.min(chipW, chipH), opacity: 1, shadowBlur: 0 });
      putOffer(PAD + 0.03, y + 0.012, chipW - 0.05, font, { color: c.onAccent });
      const nameW = col - chipW - 0.03;
      if (input.name && nameW > 0.18) {
        const nameFont = fitLine(input.name, nameW, 0.034, GLYPH.text);
        put("name", PAD + chipW + 0.03, y + (chipH - lineHeight(nameFont)) / 2, nameW, lineHeight(nameFont), nameFont, { ...TEXT, color: white });
        y += chipH + 0.02;
      } else {
        y += chipH + 0.02;
        if (input.name) {
          const nameFont = fitLine(input.name, col, 0.034, GLYPH.text);
          put("name", PAD, y, col, lineHeight(nameFont), nameFont, { ...TEXT, color: white });
          y += lineHeight(nameFont) + 0.01;
        } else hide("name");
      }
    } else {
      hide("plate");
      if (input.name) {
        const nameFont = fitLine(input.name, col, 0.034, GLYPH.text);
        put("name", PAD, y, col, lineHeight(nameFont), nameFont, { ...TEXT, color: white });
        y += lineHeight(nameFont) + 0.01;
      } else hide("name");
    }
    notesDown(input.notes, PAD, y, col, { color: white });
    return { background: c.dark, placements };
  }

  const imageH = H - 0.35,
    bottom = H - 0.05,
    inner = W - 0.14,
    rightW = inner * 0.38,
    leftW = inner - rightW - 0.04;
  put("image", 0.05, 0.05, W - 0.1, imageH, undefined, photo(0.024 / Math.min(W - 0.1, imageH)));
  hide("shade");
  hide("plate");
  hide("name");
  if (input.logo) put("logo", W - 0.08 - LOGO, 0.08, LOGO, LOGO);
  let right = notesUp(input.notes, W - 0.07 - rightW, bottom, rightW, { color: c.ink, align: "right" });
  const offer = offerFont(0.11, rightW);
  right -= offer * 1.05;
  putOffer(W - 0.07 - rightW, right, rightW, offer, { color: c.accentInk, align: "right" });
  const phrase = fitBlock(input.phrase, leftW, 0.08, 2, 0.05),
    phraseTop = bottom - phrase.height;
  put("phrase", 0.07, phraseTop, leftW, phrase.height, phrase.font, { ...HEAVY, color: c.ink });
  if (input.brand) {
    const font = fitLine(input.brand, leftW, 0.025, GLYPH.caps);
    put("brand", 0.07, phraseTop - lineHeight(font) - 0.008, leftW, lineHeight(font), font, { ...CAPS, color: c.ink });
  }
  return { background: c.light, placements };
}
