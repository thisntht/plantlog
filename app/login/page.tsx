"use client";

import { Leaf } from "lucide-react";
import { usePlantData } from "@/components/AppProviders";

export default function LoginPage() {
  const { signInWithGoogle, user, isDemo } = usePlantData();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <div className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-700">
          <Leaf aria-hidden className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-semibold text-neutral-900">PlantLog</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">식물을 압박감 없이 관찰하고, 물주기 패턴을 조용히 쌓아가는 개인용 기록 앱.</p>
      </div>
      {user ? <p className="mb-4 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">이미 로그인되어 있어요.</p> : null}
      {isDemo ? <p className="mb-4 rounded-lg bg-white px-3 py-2 text-sm leading-6 text-neutral-500">Google 로그인으로 내 식물과 기록을 저장할 수 있습니다.</p> : null}
      <div className="space-y-3">
        <button
          className="h-12 w-full rounded-md border border-neutral-200 bg-white text-sm font-semibold text-neutral-800"
          type="button"
          onClick={() => void signInWithGoogle()}
        >
          Google로 계속하기
        </button>
        <button className="h-12 w-full rounded-md border border-neutral-200 bg-white text-sm font-semibold text-neutral-900" type="button">
          Kakao로 계속하기
        </button>
      </div>
    </main>
  );
}
