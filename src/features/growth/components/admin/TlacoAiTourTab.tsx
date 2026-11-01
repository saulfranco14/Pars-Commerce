import { TlacoMascot } from "@/components/brand/TlacoMascot";

import { TOUR_VIDEO_PATH, TOUR_VIDEO_SUMMARY } from "@/features/growth/constants/tlacoAi";

/** «Tlaco te lo enseña»: the video to play for the business on the worker's phone or send it. */
export function TlacoAiTourTab() {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3">
        <TlacoMascot size={44} />
        <p className="text-sm text-muted-foreground">
          <b className="block text-foreground">Tlaco te lo enseña</b>
          {TOUR_VIDEO_SUMMARY}. Pónselo al negocio en tu celular o mándaselo.
        </p>
      </div>
      <video src={TOUR_VIDEO_PATH} controls playsInline preload="metadata" className="mx-auto aspect-9/16 max-h-88 w-auto max-w-full rounded-2xl bg-foreground">
        <track kind="captions" />
      </video>
    </div>
  );
}
