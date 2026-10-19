import { OnboardingStepHeading } from "@/features/solutions/components/onboarding/OnboardingStepHeading";
import { StorePreview } from "@/features/solutions/components/onboarding/StorePreview";

import { OPTION_CARD } from "@/features/solutions/constants/solutionStyles";
import { THEME_CHOICES } from "@/features/solutions/constants/solutionOnboarding";

export function OnboardingNameStep({
  name,
  setName,
  fallbackName,
  heroImage,
  selectedTheme,
  setSelectedTheme,
  inputRef,
  onSubmit,
}: {
  name: string;
  setName: (value: string) => void;
  fallbackName: string;
  heroImage: string;
  selectedTheme: number;
  setSelectedTheme: (value: number) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: () => void;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center lg:gap-12">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <OnboardingStepHeading
          eyebrow="Hagámoslo tuyo"
          title="¿Cómo se llama tu negocio?"
          subtitle="Lo verás aplicado en la tienda, los pedidos y el ticket."
        />
        <label htmlFor="business-name" className="mt-8 block text-sm font-semibold text-foreground">
          Nombre del negocio
        </label>
        <input
          ref={inputRef}
          id="business-name"
          name="business-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          autoComplete="organization"
          enterKeyHint="next"
          placeholder={fallbackName}
          className="mt-2 min-h-14 w-full rounded-2xl border border-border bg-surface px-4 text-lg font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-accent focus:ring-4 focus:ring-accent/15"
        />
        <fieldset className="mt-7">
          <legend className="text-sm font-semibold text-foreground">Elige una apariencia</legend>
          <div className="mt-3 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Apariencia">
            {THEME_CHOICES.map((theme, index) => {
              const active = selectedTheme === index;
              return (
                <button
                  key={theme.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedTheme(index)}
                  className={`${OPTION_CARD.base} min-h-20 p-3 ${active ? OPTION_CARD.selected : OPTION_CARD.idle}`}
                >
                  <span className="block h-6 w-6 rounded-full" style={{ background: theme.color }} />
                  <span className="mt-2 block text-sm font-semibold text-foreground">{theme.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </form>

      <div className="mt-8 lg:mt-0">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Así se verá tu tienda</p>
        <StorePreview
          name={name}
          color={THEME_CHOICES[selectedTheme].color}
          heroImage={heroImage}
          fallbackName={fallbackName}
        />
      </div>
    </div>
  );
}
