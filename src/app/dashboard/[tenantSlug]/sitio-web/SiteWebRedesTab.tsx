"use client";

import { inputForm } from "@/components/ui/inputClasses";
import { PLATFORMS } from "@/features/sitio-web/constants/socialPlatforms";
import type { SiteWebRedesTabProps } from "@/features/sitio-web/interfaces/siteWebRedesTab";

function SocialFieldLabel({
  badge,
  color,
  label,
}: {
  badge: string;
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex h-6 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold tracking-wide text-white"
        style={{ backgroundColor: color }}
      >
        {badge}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}

export function SiteWebRedesTab({
  whatsappPhone,
  onWhatsappPhoneChange,
  instagramUrl,
  onInstagramUrlChange,
  facebookUrl,
  onFacebookUrlChange,
  twitterUrl,
  onTwitterUrlChange,
  loading,
  error,
  success,
  onSave,
}: SiteWebRedesTabProps) {
  const wa = PLATFORMS.whatsapp;
  const ig = PLATFORMS.instagram;
  const fb = PLATFORMS.facebook;
  const tw = PLATFORMS.twitter;

  return (
    <form id="redes-form" onSubmit={onSave} className="space-y-4">
      <p className="mb-4 text-xs text-muted-foreground">
        Conecta tus redes sociales para que los clientes te encuentren
        fácilmente.
      </p>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700"
          role="status"
        >
          {success}
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
        <label htmlFor="whatsappPhone">
          <SocialFieldLabel badge={wa.badge} color={wa.color} label={wa.label} />
        </label>
        <input
          id="whatsappPhone"
          type={wa.type}
          value={whatsappPhone}
          onChange={(e) => onWhatsappPhoneChange(e.target.value)}
          className={inputForm}
          placeholder={wa.placeholder}
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground">{wa.hint}</p>
      </div>

      <div className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
        <label htmlFor="instagramUrl">
          <SocialFieldLabel badge={ig.badge} color={ig.color} label={ig.label} />
        </label>
        <input
          id="instagramUrl"
          type={ig.type}
          value={instagramUrl}
          onChange={(e) => onInstagramUrlChange(e.target.value)}
          className={inputForm}
          placeholder={ig.placeholder}
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground">{ig.hint}</p>
      </div>

      <div className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
        <label htmlFor="facebookUrl">
          <SocialFieldLabel badge={fb.badge} color={fb.color} label={fb.label} />
        </label>
        <input
          id="facebookUrl"
          type={fb.type}
          value={facebookUrl}
          onChange={(e) => onFacebookUrlChange(e.target.value)}
          className={inputForm}
          placeholder={fb.placeholder}
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground">{fb.hint}</p>
      </div>

      <div className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
        <label htmlFor="twitterUrl">
          <SocialFieldLabel badge={tw.badge} color={tw.color} label={tw.label} />
        </label>
        <input
          id="twitterUrl"
          type={tw.type}
          value={twitterUrl}
          onChange={(e) => onTwitterUrlChange(e.target.value)}
          className={inputForm}
          placeholder={tw.placeholder}
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground">{tw.hint}</p>
      </div>

    </form>
  );
}
