"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import type { TeamMember } from "@/types/team";

const sheetOptionClass =
  "flex w-full min-h-(--touch-target,44px) items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-border-soft/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/30";

interface MemberPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  team: TeamMember[];
}

export function MemberPickerSheet({
  isOpen,
  onClose,
  value,
  onChange,
  team,
}: MemberPickerSheetProps) {
  const handleSelect = (userId: string) => {
    onChange(userId);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Asignar a miembro">
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => handleSelect("")}
          className={sheetOptionClass}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              value === ""
                ? "border-accent bg-accent"
                : "border-muted-foreground/50"
            }`}
            aria-hidden
          >
            {value === "" && (
              <span className="h-2 w-2 rounded-full bg-white" aria-hidden />
            )}
          </span>
          <span className="text-base font-medium text-foreground">
            Sin asignar
          </span>
        </button>
        {team.map((t) => {
          const label = t.display_name || t.email || "Sin nombre";
          const isSelected = value === t.user_id;
          return (
            <button
              key={t.user_id}
              type="button"
              onClick={() => handleSelect(t.user_id)}
              className={sheetOptionClass}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected
                    ? "border-accent bg-accent"
                    : "border-muted-foreground/50"
                }`}
                aria-hidden
              >
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-white" aria-hidden />
                )}
              </span>
              <span className="text-base font-medium text-foreground">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
