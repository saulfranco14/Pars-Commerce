"use client";

import { useId } from "react";

import type { TlacoMascotProps } from "@/types/brand";

const ARM = "#a5651a";

/** The coin from «Tlaco te lo enseña»: the logo's O with a face. It blinks, and looks up while it thinks. */
export function TlacoMascot({ size = 44, full = false, thinking = false, className = "" }: TlacoMascotProps) {
  const holeId = `tlaco-mascot-${useId()}`;
  const height = full ? 150 : 112;

  return (
    <svg
      viewBox={`0 0 120 ${height}`}
      width={size}
      height={Math.round((size * height) / 120)}
      aria-hidden
      className={`tlaco-mascot shrink-0 overflow-visible ${thinking ? "tlaco-mascot--thinking" : ""} ${className}`}
    >
      <mask id={holeId}>
        <rect width="120" height={height} fill="#fff" />
        <ellipse cx="60" cy="66" rx="14" ry="19" fill="#000" />
      </mask>
      {full ? (
        <g fill={ARM}>
          <rect x="42" y="98" width="12" height="36" rx="3" />
          <rect x="66" y="98" width="12" height="36" rx="3" />
          <rect x="33" y="130" width="25" height="13" rx="6.5" />
          <rect x="62" y="130" width="25" height="13" rx="6.5" />
        </g>
      ) : null}
      <circle cx="15" cy="64" r="11" fill={ARM} />
      <circle cx="105" cy="64" r="11" fill={ARM} />
      <g mask={`url(#${holeId})`}>
        <path d="M60 18a44 44 0 0 0 0 88z" fill="var(--coin-face)" />
        <path d="M60 18a44 44 0 0 1 0 88z" fill="var(--coin-edge)" />
      </g>
      <g className="tlaco-mascot-brows" fill="#9a5d14">
        <rect x="35" y="27" width="17" height="3.6" rx="1.6" transform="rotate(5 43 29)" />
        <rect x="68" y="27" width="17" height="3.6" rx="1.6" transform="rotate(-5 77 29)" />
      </g>
      <g className="tlaco-mascot-eyes">
        <circle cx="45" cy="43" r="9" fill="#fff" />
        <circle cx="75" cy="43" r="9" fill="#fff" />
        <g className="tlaco-mascot-pupils" fill="#0f1c33">
          <circle cx="46" cy="44" r="4.6" />
          <circle cx="76" cy="44" r="4.6" />
        </g>
      </g>
      <ellipse cx="33" cy="62" rx="6" ry="3.4" fill="#f4b4a8" />
      <ellipse cx="87" cy="62" rx="6" ry="3.4" fill="#f4b4a8" />
    </svg>
  );
}
