import { HEARD_FROM_OPTIONS } from "@/features/auth/constants/heardFromOptions";

interface HeardFromSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className: string;
}

export function HeardFromSelect({ id, value, onChange, className }: HeardFromSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-muted-foreground">
        ¿Cómo conociste Tlaco? <span className="font-normal">(opcional)</span>
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={className}>
        {HEARD_FROM_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
