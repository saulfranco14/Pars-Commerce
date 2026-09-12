"use client";

interface ConfettiBurstProps {
  /** Number of particles. Keep small — this is a one-shot accent, not fireworks. */
  count?: number;
}

const COLORS = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#a855f7"];

/**
 * One-shot confetti burst (Uber/Didi-style delivery confirmation). Purely
 * decorative — mount it only while the celebrating condition is true and let
 * the parent unmount it after the animation duration (~700ms). Each particle
 * gets a random landing offset and rotation via CSS custom properties so a
 * single `@keyframes` (globals.css `.animate-confetti-burst`) drives all of
 * them without per-particle keyframes.
 */
export function ConfettiBurst({ count = 10 }: ConfettiBurstProps) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI + Math.random() * 0.5;
    const distance = 18 + Math.random() * 14;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const rot = Math.round(Math.random() * 360 - 180);
    const color = COLORS[i % COLORS.length];
    const delay = Math.random() * 80;
    return { key: i, tx, ty, rot, color, delay };
  });

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      {particles.map((p) => {
        const style = {
          backgroundColor: p.color,
          "--tx": `${p.tx}px`,
          "--ty": `${p.ty}px`,
          "--rot": `${p.rot}deg`,
          animationDelay: `${p.delay}ms`,
        } as React.CSSProperties & Record<"--tx" | "--ty" | "--rot", string>;
        return (
          <span
            key={p.key}
            className="animate-confetti-burst absolute left-1/2 top-1/2 h-1 w-1.5 rounded-[1px]"
            style={style}
          />
        );
      })}
    </div>
  );
}
