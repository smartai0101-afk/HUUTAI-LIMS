"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { HISTORY } from "@/lib/equipment-labels";
import type { HistoryEventMediaItem } from "@/types";

type Props = {
  images: HistoryEventMediaItem[];
  canManage?: boolean;
  onDelete?: (attachmentId: string) => void;
};

export function HistoryEventImageGallery({ images, canManage, onDelete }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setSlideDirection(null);
  }, [images]);

  const goTo = useCallback(
    (index: number, direction: "left" | "right") => {
      if (images.length <= 1 || isAnimating) return;
      const next = (index + images.length) % images.length;
      if (next === activeIndex) return;
      setSlideDirection(direction);
      setIsAnimating(true);
      window.setTimeout(() => {
        setActiveIndex(next);
        setSlideDirection(null);
        setIsAnimating(false);
      }, 300);
    },
    [activeIndex, images.length, isAnimating],
  );

  const goPrev = () => goTo(activeIndex - 1, "right");
  const goNext = () => goTo(activeIndex + 1, "left");

  if (images.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {HISTORY.noImages}
      </div>
    );
  }

  const current = images[activeIndex]!;
  const showNav = images.length > 1;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <div className="relative aspect-[16/10] w-full">
          <a
            href={current.path}
            target="_blank"
            rel="noreferrer"
            className="block h-full w-full"
            aria-label={current.name}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.path}
              src={current.path}
              alt={current.name}
              className={`h-full w-full object-contain transition-all duration-300 ease-in-out ${
                slideDirection === "left"
                  ? "translate-x-4 opacity-0"
                  : slideDirection === "right"
                    ? "-translate-x-4 opacity-0"
                    : "translate-x-0 opacity-100"
              }`}
            />
          </a>

          {canManage && current.source === "history" && current.attachmentId && onDelete ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(current.attachmentId!);
              }}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              title={HISTORY.deleteImage}
              aria-label={HISTORY.deleteImage}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {showNav ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={isAnimating}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white disabled:opacity-50"
              aria-label={HISTORY.prevImage}
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={isAnimating}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white disabled:opacity-50"
              aria-label={HISTORY.nextImage}
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
          </>
        ) : null}
      </div>

      {showNav ? (
        <div className="flex items-center justify-center gap-3">
          <div className="flex gap-1.5">
            {images.map((img, index) => (
              <button
                key={`${img.path}-${index}`}
                type="button"
                onClick={() => goTo(index, index > activeIndex ? "left" : "right")}
                disabled={isAnimating}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === activeIndex ? "bg-cyan-600" : "bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={HISTORY.imageCounter(index + 1, images.length)}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500">
            {HISTORY.imageCounter(activeIndex + 1, images.length)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
