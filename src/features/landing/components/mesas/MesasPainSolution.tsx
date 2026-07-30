import { ArrowRight, Check } from "lucide-react";

import { MESAS_PAINS } from "@/features/landing/constants/mesas";

export function MesasPainSolution() {
  return (
    <ul className="mt-12 grid gap-4 sm:grid-cols-2">
      {MESAS_PAINS.map(({ key, pain, solution, icon: Icon }) => (
        <li
          key={key}
          className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/20 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/6 text-muted-foreground">
              <Icon className="h-4.5 w-4.5" aria-hidden />
            </div>
            <p className="text-[15px] font-semibold leading-snug text-foreground">
              “{pain}”
            </p>
          </div>

          <div className="my-4 flex items-center gap-2 text-accent" aria-hidden>
            <span className="h-px flex-1 bg-border" />
            <ArrowRight className="h-4 w-4 rotate-90" />
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Check className="h-4.5 w-4.5" aria-hidden />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {solution}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
