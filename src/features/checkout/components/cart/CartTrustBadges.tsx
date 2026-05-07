"use client";

import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TrustBadge {
  icon: LucideIcon;
  text: string;
}

const BADGES: TrustBadge[] = [
  { icon: ShieldCheck, text: "Pago protegido con Mercado Pago" },
  { icon: BadgeCheck, text: "Confirmación inmediata al pagar" },
  { icon: Sparkles, text: "Cambios de pago según tu preferencia" },
];

export function CartTrustBadges() {
  return (
    <div className="hidden gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-3 sm:p-5 lg:grid">
      {BADGES.map(({ icon: Icon, text }) => (
        <div
          key={text}
          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3"
        >
          <Icon className="h-5 w-5 shrink-0 text-gray-500" />
          <p className="text-xs font-medium text-gray-700">{text}</p>
        </div>
      ))}
    </div>
  );
}
