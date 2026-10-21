export function WizardStepHeading({
  titleId,
  eyebrow,
  title,
  subtitle,
}: {
  titleId: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">{eyebrow}</p>
      <h1
        id={titleId}
        className="mt-2 max-w-[22ch] text-balance text-[1.75rem] font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl"
      >
        {title}
      </h1>
      <p className="mt-3 text-base text-muted-foreground sm:text-lg">{subtitle}</p>
    </div>
  );
}
