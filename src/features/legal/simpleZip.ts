const encoder = new TextEncoder();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number) { return [value & 255, (value >>> 8) & 255]; }
function u32(value: number) { return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]; }

/** A deliberately small, dependency-free ZIP writer. Files are stored (not
 * compressed), which keeps legal exports deterministic and easy to inspect. */
export function createStoredZip(entries: Array<{ name: string; content: string }>) {
  const parts: number[] = [];
  const central: number[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const content = encoder.encode(entry.content);
    const crc = crc32(content);
    const local = [...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(content.length), ...u32(content.length), ...u16(name.length), ...u16(0), ...name, ...content];
    parts.push(...local);
    central.push(...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(content.length), ...u32(content.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name);
    offset += local.length;
  }
  const footer = [...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length), ...u32(central.length), ...u32(offset), ...u16(0)];
  return new Uint8Array([...parts, ...central, ...footer]);
}
