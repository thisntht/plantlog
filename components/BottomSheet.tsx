"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

export function BottomSheet({
  title,
  children,
  onClose
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-neutral-950/25 px-3" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" aria-label="닫기" onClick={onClose} />
      <section className="safe-bottom relative mx-auto w-full max-w-md rounded-t-2xl bg-white px-5 pt-4 shadow-soft">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200" />
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
            type="button"
            onClick={onClose}
            aria-label="닫기"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <div className="sheet-scroll pb-3">{children}</div>
      </section>
    </div>
  );
}
