import { TlacoLogo } from "@/components/brand/TlacoLogo";

export function StudioWordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-baseline gap-2">
      <TlacoLogo size="sm" className={inverse ? "!text-white" : ""} />
      <span
        className={`text-sm font-medium tracking-tight ${inverse ? "text-slate-300" : "text-muted-foreground"}`}
      >
        Studio
      </span>
    </span>
  );
}
