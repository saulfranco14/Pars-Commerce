"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SavedReview {
  rating: number;
  comment?: string | null;
}

interface ReviewOrderItemProps {
  token: string;
  itemId: string;
  productName: string;
  imageUrl?: string | null;
  initialReview?: SavedReview | null;
}

const RATING_LABELS: Record<number, string> = {
  1: "Muy mala",
  2: "Mala",
  3: "Regular",
  4: "Buena",
  5: "Excelente",
};

export function ReviewOrderItem({
  token,
  itemId,
  productName,
  imageUrl,
  initialReview = null,
}: ReviewOrderItemProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [comment, setComment] = useState(initialReview?.comment ?? "");
  const [savedReview, setSavedReview] = useState<SavedReview | null>(
    initialReview,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const openRequestedReview = (event: Event) => {
      const detail = (event as CustomEvent<{ itemId?: string }>).detail;
      if (detail?.itemId !== itemId || savedReview) return;
      setOpen(true);
      window.setTimeout(() => triggerRef.current?.focus(), 450);
    };
    window.addEventListener("tlaco:open-review", openRequestedReview);
    return () =>
      window.removeEventListener("tlaco:open-review", openRequestedReview);
  }, [itemId, savedReview]);

  async function submit() {
    if (!rating || submitting || savedReview) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/pedido/${encodeURIComponent(token)}/resenas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_item_id: itemId,
            rating,
            comment: comment.trim(),
          }),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo guardar tu reseña.");
      }
      setSavedReview({ rating, comment: comment.trim() || null });
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo guardar tu reseña.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article id={`review-${itemId}`} className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-surface">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-16 w-full items-center gap-3 px-3 py-3 text-left sm:px-4"
        aria-expanded={open}
      >
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-border-soft">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <Star className="h-5 w-5 text-muted-foreground" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {productName}
          </span>
          {savedReview ? (
            <span className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Reseña enviada · {savedReview.rating} de 5
            </span>
          ) : (
            <span className="mt-1 block text-xs text-muted-foreground">
              Toca para calificar tu compra
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="border-t border-border px-3 pb-4 pt-4 sm:px-4">
          {savedReview ? (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-900">
              <div className="flex gap-1" aria-label={`${savedReview.rating} de 5 estrellas`}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`h-4 w-4 ${
                      value <= savedReview.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-emerald-200"
                    }`}
                    aria-hidden
                  />
                ))}
              </div>
              {savedReview.comment ? (
                <p className="mt-2 text-sm leading-5">{savedReview.comment}</p>
              ) : (
                <p className="mt-2 text-sm">Calificación sin comentario.</p>
              )}
            </div>
          ) : (
            <>
              <fieldset disabled={submitting}>
                <legend className="text-sm font-semibold text-foreground">
                  ¿Cómo te fue con este artículo?
                </legend>
                <div className="mt-3 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        value <= rating
                          ? "border-amber-300 bg-amber-50 text-amber-500"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                      aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
                      aria-pressed={rating === value}
                    >
                      <Star
                        className={`h-5 w-5 ${value <= rating ? "fill-current" : ""}`}
                        aria-hidden
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2 min-h-5 text-xs font-medium text-muted-foreground">
                  {rating ? RATING_LABELS[rating] : "Elige de 1 a 5 estrellas"}
                </p>
                <label className="mt-3 block">
                  <span className="text-sm font-semibold text-foreground">
                    Cuéntanos más <span className="font-normal text-muted-foreground">(opcional)</span>
                  </span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="¿Qué te gustó o qué podría mejorar?"
                    rows={3}
                    maxLength={1500}
                    className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </fieldset>
              {error ? (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!rating || submitting}
                aria-busy={submitting}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Star className="h-4 w-4" aria-hidden />
                )}
                {submitting ? "Enviando reseña…" : "Enviar reseña"}
              </button>
            </>
          )}
        </div>
      ) : null}
    </article>
  );
}
