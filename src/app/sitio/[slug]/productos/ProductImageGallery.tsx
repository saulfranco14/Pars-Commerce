"use client";

import { useState } from "react";
import Image from "next/image";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageGalleryProps {
  imageUrls: string[];
  productName: string;
  accentColor: string;
}

export default function ProductImageGallery({
  imageUrls,
  productName,
  accentColor,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mainUrl = imageUrls[selectedIndex] ?? imageUrls[0];

  if (imageUrls.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-gray-100">
        <Package className="h-24 w-24 text-gray-300" />
      </div>
    );
  }

  const goPrev = () => setSelectedIndex((i) => (i > 0 ? i - 1 : imageUrls.length - 1));
  const goNext = () => setSelectedIndex((i) => (i < imageUrls.length - 1 ? i + 1 : 0));

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50">
        <Image
          key={mainUrl}
          src={mainUrl}
          alt={productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-500"
          priority
          quality={80}
        />
        {/* Navigation arrows (only when multiple images) */}
        {imageUrls.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg active:scale-95"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg active:scale-95"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {imageUrls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedIndex(i)}
                  className={`h-2 rounded-full transition-all ${i === selectedIndex ? "w-5 bg-white" : "w-2 bg-white/60"}`}
                  aria-label={`Ver imagen ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageUrls.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-gray-50 transition-all focus:outline-none ${
                selectedIndex === i
                  ? "scale-105 shadow-md"
                  : "opacity-60 hover:opacity-90"
              }`}
              style={{
                borderColor: selectedIndex === i ? accentColor : "transparent",
              }}
              aria-label={`Ver imagen ${i + 1}`}
            >
              <Image
                src={url}
                alt={`${productName} ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
                loading="lazy"
                quality={60}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
