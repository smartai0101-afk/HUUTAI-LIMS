"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TouchVerticalScrollProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  showFade?: boolean;
  fadeClassName?: string;
};

export function TouchVerticalScroll({
  children,
  className,
  contentClassName,
  showFade = true,
  fadeClassName = "from-white",
}: TouchVerticalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 4);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 4);
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
    <div className={cn("relative flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <div
        ref={scrollRef}
        className={cn(
          "touch-scroll-y scrollbar-hide h-full min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain",
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
              "pointer-events-none absolute inset-x-0 top-0 z-20 h-6 bg-gradient-to-b to-transparent transition-opacity lg:hidden",
              fadeClassName,
              canScrollUp ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 z-20 h-6 bg-gradient-to-t to-transparent transition-opacity lg:hidden",
              fadeClassName,
              canScrollDown ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      ) : null}
    </div>
  );
}
