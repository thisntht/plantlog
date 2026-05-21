"use client";

import { Camera, Save } from "lucide-react";

export function PlantForm() {
  return (
    <form className="space-y-5 rounded-2xl bg-white p-4 shadow-soft">
      <Field label="표시 이름" placeholder="큰 몬스" required />
      <Field label="물주기 주기" placeholder="7" required type="number" suffix="일" />
      <Field label="정식 식물명" placeholder="Monstera deliciosa" />
      <Field label="식물 종류" placeholder="몬스테라" />
      <Field label="시작일" type="date" />
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-neutral-700">메모</span>
        <textarea className="min-h-28 w-full resize-none rounded-lg border border-neutral-200 p-3 text-base outline-none focus:border-leaf-400" />
      </label>
      <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 text-sm font-medium text-neutral-500" type="button">
        <Camera aria-hidden className="h-4 w-4" />
        대표 사진
      </button>
      <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-leaf-700 text-sm font-semibold text-white" type="button">
        <Save aria-hidden className="h-4 w-4" />
        저장
      </button>
    </form>
  );
}

function Field({
  label,
  placeholder,
  required,
  type = "text",
  suffix
}: {
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
        {required ? <span className="text-leaf-700"> *</span> : null}
      </span>
      <div className="flex items-center rounded-lg border border-neutral-200 bg-white px-3 focus-within:border-leaf-400">
        <input className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none" type={type} placeholder={placeholder} />
        {suffix ? <span className="text-sm text-neutral-400">{suffix}</span> : null}
      </div>
    </label>
  );
}
