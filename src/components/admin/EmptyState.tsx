import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "accent" | "muted";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "accent",
}: EmptyStateProps) {
  const iconBg =
    tone === "accent" ? "bg-accent/10 text-accent" : "bg-border-soft text-muted-foreground";
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full ${iconBg}`}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="max-w-sm">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {description && (
          <div className="mt-1 text-sm text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
