import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface AdminListCardProps {
  icon?: LucideIcon;
  title: string;
  meta?: ReactNode;
  badge?: ReactNode;
  thumbnail?: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  highlighted?: boolean;
  /** Tighter padding for long lists scanned row by row. */
  compact?: boolean;
}

export function AdminListCard({
  icon: Icon,
  title,
  meta,
  badge,
  thumbnail,
  body,
  actions,
  highlighted,
  compact,
}: AdminListCardProps) {
  return (
    <article
      className={`flex flex-col rounded-2xl border bg-surface transition-colors ${compact ? "h-full gap-2 px-3 py-2.5" : "gap-3 p-4"} ${
        highlighted
          ? "border-accent shadow-md shadow-accent/10"
          : "border-border hover:border-accent/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {thumbnail && <div className="shrink-0">{thumbnail}</div>}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {Icon && (
                <Icon
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              )}
              <h3 className="truncate text-base font-bold text-foreground">
                {title}
              </h3>
            </div>
            {meta && (
              <div className="mt-0.5 text-xs text-muted-foreground">{meta}</div>
            )}
          </div>
        </div>
        {badge}
      </div>

      {body && <div className="text-sm text-foreground">{body}</div>}

      {actions && (
        <div className="mt-auto flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </article>
  );
}
