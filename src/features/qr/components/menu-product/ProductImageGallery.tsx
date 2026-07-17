"use client";

import { useRef, useState } from "react";
import Image from "next/image";

import { BrandImage } from "@/features/qr/components/BrandImage";

import type { ProductImageGalleryProps } from "@/features/qr/interfaces/productImageGallery";

/**
 * Swipeable multi-photo view for the product detail sheet. A single image
 * renders exactly like the old plain <BrandImage> (no dots, no swipe chrome)
 * — the gallery UI only appears once there's something to navigate between.
 * No `images` at all falls back to <BrandImage>'s own logo/initials/mark
 * cascade, same as every other customer-facing image tile.
 */
export function ProductImageGallery({
  images,
  logoUrl,
  name,
  alt,
  className = "",
  rounded = "rounded-none",
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <BrandImage
        src={null}
        logoUrl={logoUrl}
        name={name}
        alt={alt}
        className={className}
        rounded={rounded}
      />
    );
  }

  if (images.length === 1) {
    return (
      <BrandImage
        src={images[0]}
        logoUrl={logoUrl}
        name={name}
        alt={alt}
        className={className}
        rounded={rounded}
      />
    );
  }

  function scrollToIndex(index: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }

  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <div
            key={src}
            className="relative h-full w-full shrink-0 snap-center bg-border-soft/30"
          >
            <Image
              src={src}
              alt={i === 0 ? alt : `${alt} — foto ${i + 1}`}
              fill
              loading={i === 0 ? "eager" : "lazy"}
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => scrollToIndex(i)}
            aria-label={`Ver foto ${i + 1}`}
            className={`pointer-events-auto h-1.5 rounded-full transition-all ${
              i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
