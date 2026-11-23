import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
  /** One row on phones too: for focused editors that must fit on one screen. */
  compact?: boolean;
}

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  compact = false,
}: PageHeaderProps) {
  if (compact)
    return (
      <header className="flex items-center gap-3">
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {title}
        </h1>
        {action && <div className="shrink-0">{action}</div>}
      </header>
    );
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
