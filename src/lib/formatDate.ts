export function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const orderDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor(
    (today.getTime() - orderDay.getTime()) / (1000 * 60 * 60 * 24)
  );
  const time = d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (diffDays === 0) return `Hoy ${time}`;
  if (diffDays === 1) return `Ayer ${time}`;
  if (diffDays < 7)
    return `${d.getDate()} ${d.toLocaleDateString("es-MX", {
      month: "short",
    })} ${time}`;
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
