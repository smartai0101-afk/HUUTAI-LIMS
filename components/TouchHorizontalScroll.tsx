"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TouchHorizontalScrollProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  showFade?: boolean;
  snap?: boolean;
};

export function TouchHorizontalScroll({
  children,
  className,
  contentClassName,
  showFade = true,
  snap = false,
}: TouchHorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateFade();

    el.addEventListener("scroll", updateFade, { passive: true });
    const observer = new ResizeObserver(updateFade);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateFade);
      observer.disconnect();
    };
  }, [updateFade]);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollRef}
        className={cn(
          "touch-scroll-x scrollbar-hide overflow-x-auto overflow-y-hidden overscroll-x-contain",
          snap && "snap-x snap-proximity",
          contentClassName,
        )}
      >
        {children}
      </div>
      {showFade ? (
        <>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 z-20 w-6 bg-gradient-to-r from-white to-transparent transition-opacity lg:hidden",
              canScrollLeft ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-gradient-to-l from-white to-transparent transition-opacity lg:hidden",
              canScrollRight ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      ) : null}
    </div>
  );
}
