"use client";

import { useState } from "react";
import { Package } from "lucide-react";

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
      <div className="flex aspect-square w-full items-center justify-center bg-gray-50">
        <Package className="h-24 w-24 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50">
        <img
          src={mainUrl}
          alt={productName}
          className="h-full w-full object-contain"
        />
      </div>
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
          {imageUrls.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                borderColor: selectedIndex === i ? accentColor : "transparent",
              }}
              aria-label={`Ver imagen ${i + 1}`}
            >
              <img
                src={url}
                alt={`${productName} ${i + 1}`}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
