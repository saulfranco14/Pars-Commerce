import { AD_KIND_LABEL, AD_KINDS } from "@/features/growth/constants/prospectAds";
import { paraAdImageUrl } from "@/features/growth/services/adsClient";

/** The prospect's four ads from its public «Para ti» token; `version` refetches them after «Otro» or a new price. */
export function MiniAppAds({ token, version, only }: { token: string; version: number; only?: (typeof AD_KINDS)[number] }) {
  const kinds = only ? [only] : AD_KINDS;
  return (
    <ul className={`grid gap-1.5 ${only ? "w-1/2" : "grid-cols-4"}`}>
      {kinds.map((kind) => (
        <li key={kind} className="overflow-hidden rounded-lg bg-border-soft/50">
          {/* eslint-disable-next-line @next/next/no-img-element -- server-drawn PNG of this prospect. */}
          <img src={`${paraAdImageUrl(token, kind)}?v=${version}`} alt={AD_KIND_LABEL[kind]} width={1080} height={1350} loading="lazy" className="aspect-4/5 h-auto w-full object-cover" />
        </li>
      ))}
    </ul>
  );
}
