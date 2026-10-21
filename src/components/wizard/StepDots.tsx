export function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === current ? "w-7 bg-accent" : index < current ? "w-1.5 bg-accent/50" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">
        Paso {current + 1} de {total}
      </span>
    </div>
  );
}
