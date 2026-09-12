/** Navegador y sistema, para que el dueño reconozca de qué equipo se trata. */
export function describeUserAgent(ua: string | null): string {
  if (!ua) return "Dispositivo desconocido";

  const os =
    /Windows/i.test(ua) ? "Windows"
    : /Android/i.test(ua) ? "Android"
    : /iPad|iPhone|iPod/i.test(ua) ? "iPad o iPhone"
    : /Mac OS X/i.test(ua) ? "Mac"
    : /Linux/i.test(ua) ? "Linux"
    : "Sistema desconocido";

  const browser =
    /Edg\//i.test(ua) ? "Edge"
    : /OPR\//i.test(ua) ? "Opera"
    : /Chrome\//i.test(ua) ? "Chrome"
    : /Firefox\//i.test(ua) ? "Firefox"
    : /Safari\//i.test(ua) ? "Safari"
    : "Navegador desconocido";

  return `${browser} en ${os}`;
}
