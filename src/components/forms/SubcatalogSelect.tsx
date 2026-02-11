"use client";

import { useState, useRef, useEffect } from "react";
import type { Subcatalog } from "@/types/subcatalogs";
import { ChevronDown } from "lucide-react";

interface SubcatalogSelectProps {
  subcatalogs: Subcatalog[];
  value: string;
  onChange: (subcatalogId: string) => void;
  disabled?: boolean;
  id?: string;
}

export function SubcatalogSelect({
  subcatalogs,
  value,
  onChange,
  disabled = false,
  id = "subcatalog",
}: SubcatalogSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = [
    { id: "", name: "Sin subcatalog" },
    ...subcatalogs.map((s) => ({ id: s.id, name: s.name })),
  ];
  const selected = options.find((o) => o.id === value);
  const displayValue = selected?.name ?? "Sin subcatalog";

  useEffect(() => {
    if (!isOpen) setHighlightIndex(0);
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(id: string) {
    onChange(id);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = options[highlightIndex];
      if (item) handleSelect(item.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label`}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
      >
        <span className={value ? "text-foreground" : "text-muted"}>
          {displayValue}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {isOpen && (
        <ul
          className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-border bg-surface-raised py-1 shadow-lg"
          role="listbox"
          aria-activedescendant={options[highlightIndex] ? `${id}-opt-${highlightIndex}` : undefined}
        >
          {options.map((opt, i) => (
            <li
              key={opt.id || "none"}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={opt.id === value}
              onMouseEnter={() => setHighlightIndex(i)}
              onClick={() => handleSelect(opt.id)}
              className={`flex min-h-[44px] cursor-pointer items-center px-3 py-2.5 text-sm sm:min-h-[40px] sm:py-2 ${
                i === highlightIndex
                  ? "bg-accent/10 text-foreground"
                  : "text-foreground hover:bg-border-soft/60"
              }`}
            >
              {opt.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
