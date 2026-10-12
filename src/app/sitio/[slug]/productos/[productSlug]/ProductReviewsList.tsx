"use client";

import { Loader2, Star } from "lucide-react";
import { useState } from "react";

export interface PublicProductReview {
  id: string;
  rating: number;
  comment: string | null;
  published_at: string | null;
}

interface ProductReviewsListProps {
  productId: string;
  initialReviews: PublicProductReview[];
  total: number;
  averageRating: number | null;
  accentColor: string;
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-4 w-4 ${
            value <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-gray-200"
          }`}
          aria-hidden
        />
      ))}
    </span>
  );
}

export default function ProductReviewsList({
  productId,
  initialReviews,
  total,
  averageRating,
  accentColor,
}: ProductReviewsListProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [hasMore, setHasMore] = useState(initialReviews.length < total);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        product_id: productId,
        offset: String(reviews.length),
      });
      const response = await fetch(`/api/public/product-reviews?${params}`);
      const payload = (await response.json()) as {
        reviews?: PublicProductReview[];
        hasMore?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudieron cargar las reseñas.");
      }

      const incoming = payload.reviews ?? [];
      setReviews((current) => {
        const existingIds = new Set(current.map((review) => review.id));
        return [...current, ...incoming.filter((review) => !existingIds.has(review.id))];
      });
      setHasMore(Boolean(payload.hasMore));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron cargar las reseñas.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!total || averageRating === null) return null;

  return (
    <section aria-labelledby="product-reviews-title" className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            Opiniones de compras reales
          </p>
          <h2 id="product-reviews-title" className="mt-1 text-2xl font-bold text-gray-950">
            Reseñas verificadas
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold tabular-nums text-gray-950">
            {averageRating.toFixed(1)}
          </span>
          <div>
            <ReviewStars rating={Math.round(averageRating)} />
            <p className="mt-1 text-xs text-gray-500">
              {total} {total === 1 ? "reseña" : "reseñas"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 [content-visibility:auto]"
          >
            <ReviewStars rating={Number(review.rating)} />
            <p className="mt-3 text-sm leading-6 text-gray-700">
              {review.comment?.trim() || "Calificación verificada sin comentario."}
            </p>
            <p className="mt-3 text-xs font-medium text-gray-400">
              Compra verificada
              {review.published_at
                ? ` · ${new Intl.DateTimeFormat("es-MX", {
                    month: "short",
                    year: "numeric",
                  }).format(new Date(review.published_at))}`
                : ""}
            </p>
          </article>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {hasMore ? (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loading}
          aria-busy={loading}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          style={{ borderColor: `${accentColor}55`, color: accentColor }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {loading ? "Cargando reseñas…" : "Ver más reseñas"}
        </button>
      ) : null}
    </section>
  );
}
