"use client";

import { useEffect, useRef, useState } from "react";

interface ScaledIframeProps {
  src: string;
  logicalWidth: number;
  logicalHeight: number;
  mobile: boolean;
}

export function ScaledIframe({
  src,
  logicalWidth,
  logicalHeight,
  mobile,
}: ScaledIframeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const sx = width / logicalWidth;
      const sy = height / logicalHeight;
      setScale(Math.min(sx, sy, 1));
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [logicalWidth, logicalHeight]);

  const scaledW = logicalWidth * scale;
  const scaledH = logicalHeight * scale;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-start justify-center overflow-hidden p-4"
    >
      {mobile ? (
        <div
          className="relative overflow-hidden rounded-[2.5rem] border-8 border-gray-800 shadow-2xl"
          style={{ width: scaledW + 16, height: scaledH - 56 }}
        >
          <div className="absolute left-1/2 top-1.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-gray-700" />
          <div
            className="overflow-hidden rounded-[1.8rem]"
            style={{ width: scaledW, height: scaledH }}
          >
            <iframe
              src={src}
              title="Vista previa"
              style={{
                width: logicalWidth,
                height: logicalHeight,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                border: "none",
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ width: scaledW, height: scaledH, overflow: "hidden" }}>
          <iframe
            src={src}
            title="Vista previa"
            style={{
              width: logicalWidth,
              height: logicalHeight,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              border: "none",
              pointerEvents: "none",
            }}
          />
        </div>
      )}
    </div>
  );
}
