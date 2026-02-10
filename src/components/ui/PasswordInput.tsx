"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const baseInputClass =
  "input-form block w-full min-h-[44px] rounded-xl border px-3 py-2.5 pr-12 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputClassName?: string;
}

export function PasswordInput({
  label,
  id,
  value,
  onChange,
  inputClassName,
  className,
  ...rest
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative mt-1">
        <input
          {...rest}
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          className={
            inputClassName
              ? `${inputClassName} pr-12`
              : baseInputClass
          }
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-border-soft/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" aria-hidden />
          ) : (
            <Eye className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
