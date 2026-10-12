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
      <div className="flex aspect-square w-full items-center justify-center rounded-[22px] bg-white">
        <Package className="h-24 w-24 text-gray-300" />
      </div>
    );
  }

  const goPrev = () => setSelectedIndex((i) => (i > 0 ? i - 1 : imageUrls.length - 1));
  const goNext = () => setSelectedIndex((i) => (i < imageUrls.length - 1 ? i + 1 : 0));

  return (
    <div className="space-y-3">
      <div className="group relative aspect-square w-full overflow-hidden rounded-[22px] bg-white shadow-[0_16px_44px_-34px_rgba(15,23,42,0.55)]">
        <Image
          key={mainUrl}
          src={mainUrl}
          alt={productName}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 52vw, 620px"
          className="object-contain p-2 transition-transform duration-500 sm:p-3"
          priority
          quality={80}
        />
        {imageUrls.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/80 bg-white/95 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg active:scale-95"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/80 bg-white/95 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg active:scale-95"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/30 px-2 py-1.5 backdrop-blur-sm">
              {imageUrls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === selectedIndex ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
                  aria-label={`Ver imagen ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {imageUrls.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
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
                className="object-contain p-0.5"
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
