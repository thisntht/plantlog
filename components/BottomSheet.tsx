"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

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
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-neutral-950/25 px-3" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" aria-label="닫기" onClick={onClose} />
      <section className="safe-bottom relative mx-auto flex max-h-[calc(100dvh-7rem)] w-full max-w-md flex-col overflow-hidden rounded-t-lg border border-neutral-200 bg-white px-5 pt-4">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200" />
        <div className="mb-4 flex min-h-9 items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            {headerLeft}
            {title ? <h2 className="ml-1 text-lg font-semibold text-neutral-900">{title}</h2> : null}
          </div>
          <div className="flex items-center gap-1">
            {headerAction}
            {hideCloseButton ? null : (
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
                type="button"
                onClick={onClose}
                aria-label="닫기"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        <div className="sheet-scroll min-h-0 max-w-full flex-1 overflow-y-auto overflow-x-hidden pb-3">{children}</div>
      </section>
    </div>
  );
}
