import type { SectionHeaderProps } from "@/features/landing/interfaces/landingSection";

/** Eyebrow, headline with its accented second half, and one short lead. */
export function SectionHeader({ eyebrow, title, accent, lead, dark = false }: SectionHeaderProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p
        className={`text-xs font-bold uppercase tracking-widest ${dark ? "text-blue-300" : "text-accent"}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-balance text-3xl font-bold leading-[1.08] tracking-tight sm:text-5xl ${
          dark ? "text-white" : "text-foreground"
        }`}
      >
        {title}
        {accent && (
          <>
            {" "}
            <span className="text-accent">{accent}</span>
          </>
        )}
      </h2>
      {lead && (
        <p
          className={`mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${
            dark ? "text-slate-300" : "text-muted-foreground"
          }`}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
