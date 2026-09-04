"use client";

import { useEffect, useRef } from "react";
import type { ReactNode, TouchEvent } from "react";
import { X } from "lucide-react";

let bodyScrollLocks = 0;
let originalBodyOverflow = "";

export function useBodyScrollLock() {
  useEffect(() => {
    if (bodyScrollLocks === 0) {
      originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    bodyScrollLocks += 1;

    return () => {
      bodyScrollLocks = Math.max(0, bodyScrollLocks - 1);
      if (bodyScrollLocks === 0) document.body.style.overflow = originalBodyOverflow;
    };
  }, []);
}

export function BottomSheet({
  title,
  headerAction,
  headerLeft,
  hideCloseButton = false,
  children,
  onClose
}: {
  title?: string;
  headerAction?: ReactNode;
  headerLeft?: ReactNode;
  hideCloseButton?: boolean;
  children: ReactNode;
  onClose: () => void;
}) {
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  useBodyScrollLock();
  const startDrag = (event: TouchEvent) => {
    const touch = event.touches[0];
    dragStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const endDrag = (event: TouchEvent) => {
    const start = dragStartRef.current;
    const touch = event.changedTouches[0];
    dragStartRef.current = null;
    if (!start || !touch) return;

    const distanceX = touch.clientX - start.x;
    const distanceY = touch.clientY - start.y;
    if (distanceY > 72 && distanceY > Math.abs(distanceX) * 1.25) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 touch-none overflow-hidden bg-neutral-950/35 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" aria-label="닫기" onClick={onClose} />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col">
        <header className="mb-5 flex min-h-12 touch-none items-center justify-between gap-4 text-white" onTouchStart={startDrag} onTouchEnd={endDrag}>
          <div className="flex min-w-0 items-center gap-1 [&>button]:text-white [&>button:hover]:bg-white/10">
            {headerLeft}
            {title ? <h2 className="ml-1 truncate text-2xl font-bold">{title}</h2> : null}
          </div>
          <div className="flex items-center gap-1 [&>button]:text-white [&>button:hover]:bg-white/10">
            {headerAction}
            {hideCloseButton ? null : (
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/85 hover:bg-white/10"
                type="button"
                onClick={onClose}
                aria-label="닫기"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            )}
          </div>
        </header>
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.6rem] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
          <div className="touch-none px-5 pt-3" onTouchStart={startDrag} onTouchEnd={endDrag}>
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-neutral-200" />
          </div>
          <div className="sheet-scroll min-h-0 max-w-full flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain px-5 pb-5">{children}</div>
        </section>
      </div>
    </div>
  );
}
