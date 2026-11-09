import { StudioProviderError } from "./providers.ts";

export function studioImageMetadata(bytes: Uint8Array): {
  width: number;
  height: number;
  mime: string;
} {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset: number, length: number) =>
    new TextDecoder().decode(bytes.subarray(offset, offset + length));
  let width = 0,
    height = 0,
    mime = "";
  if (bytes.length < 24 || bytes.length > 12 * 1024 * 1024)
    throw new StudioProviderError("INVALID_IMAGE_OUTPUT");
  if (
    view.getUint32(0) === 0x89504e47 &&
    view.getUint32(4) === 0x0d0a1a0a &&
    ascii(12, 4) === "IHDR"
  ) {
    width = view.getUint32(16);
    height = view.getUint32(20);
    mime = "image/png";
  } else if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let position = 2;
    while (position + 4 < bytes.length) {
      if (bytes[position++] !== 0xff) break;
      while (bytes[position] === 0xff) position++;
      const marker = bytes[position++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (position + 2 > bytes.length) break;
      const length = view.getUint16(position);
      if (length < 2 || position + length > bytes.length) break;
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker) &&
        length >= 8
      ) {
        height = view.getUint16(position + 3);
        width = view.getUint16(position + 5);
        mime = "image/jpeg";
        break;
      }
      position += length;
    }
  } else if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const type = ascii(12, 4);
    mime = "image/webp";
    if (type === "VP8X" && bytes.length >= 30) {
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
      if (bytes[20] & 2)
        throw new StudioProviderError("ANIMATED_IMAGE_NOT_SUPPORTED");
    } else if (
      type === "VP8 " &&
      bytes.length >= 30 &&
      bytes[23] === 0x9d &&
      bytes[24] === 1 &&
      bytes[25] === 0x2a
    ) {
      width = view.getUint16(26, true) & 0x3fff;
      height = view.getUint16(28, true) & 0x3fff;
    } else if (type === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      width = (bits & 0x3fff) + 1;
      height = ((bits >>> 14) & 0x3fff) + 1;
    }
  }
  if (!width || !height || width * height > 24_000_000)
    throw new StudioProviderError("INVALID_IMAGE_DIMENSIONS");
  return { width, height, mime };
}
