import { STATS } from "@/features/landing/constants/stats";

export function LandingStats() {
  return (
    <section className="border-t border-border py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label, accent }) => (
            <div
              key={value}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{value}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
