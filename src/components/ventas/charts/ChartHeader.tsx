"use client";

interface ChartHeaderProps {
  title: string;
  description: string;
  dateFrom: string | null;
  dateTo: string | null;
}

function formatDateRange(dateFrom: string | null, dateTo: string | null): string {
  if (!dateFrom && !dateTo) return "Todos los datos disponibles";
  if (dateFrom && !dateTo) return `Desde el ${formatDate(dateFrom)}`;
  if (!dateFrom && dateTo) return `Hasta el ${formatDate(dateTo)}`;
  if (dateFrom === dateTo) return formatDate(dateFrom);
  return `${formatDate(dateFrom)} al ${formatDate(dateTo)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ChartHeader({
  title,
  description,
  dateFrom,
  dateTo,
}: ChartHeaderProps) {
  const dateRange = formatDateRange(dateFrom, dateTo);

  return (
    <div className="mb-2 sm:mb-3">
      <h3 className="text-sm font-medium text-foreground sm:text-base">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground sm:text-sm">
        {dateRange}
      </p>
    </div>
  );
}
