"use client";

import { Leaf } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <div className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700">
          <Leaf aria-hidden className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-semibold text-neutral-900">PlantLog</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">식물을 압박감 없이 관찰하고, 물주기 패턴을 조용히 쌓아가는 개인용 기록 앱.</p>
      </div>
      <div className="space-y-3">
        <button className="h-12 w-full rounded-lg border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 shadow-[0_8px_25px_rgba(35,55,40,0.05)]" type="button">
          Google로 계속하기
        </button>
        <button className="h-12 w-full rounded-lg bg-[#FEE500] text-sm font-semibold text-neutral-900" type="button">
          Kakao로 계속하기
        </button>
      </div>
    </main>
  );
}
