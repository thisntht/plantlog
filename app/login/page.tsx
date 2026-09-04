"use client";

import { useEffect, useState } from "react";
import { usePlantData } from "@/components/AppProviders";

export default function LoginPage() {
  const { signInWithGoogle, signInWithKakao, user, isDemo } = usePlantData();
  const [pendingProvider, setPendingProvider] = useState<"google" | "kakao" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error_description") || params.get("error");
    if (error) setErrorMessage(decodeURIComponent(error));
  }, []);

  async function handleLogin(provider: "google" | "kakao") {
    setErrorMessage("");
    setPendingProvider(provider);

    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithKakao();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
      setPendingProvider(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-neutral-900">PlantLog</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">식물을 압박감 없이 관찰하고, 물주기 패턴을 조용히 쌓아가는 개인용 기록 앱.</p>
      </div>
      {user ? <p className="mb-4 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">이미 로그인되어 있어요.</p> : null}
      {isDemo ? <p className="mb-4 rounded-lg bg-white px-3 py-2 text-sm leading-6 text-neutral-500">Google 또는 Kakao 로그인으로 내 식물과 기록을 저장할 수 있습니다.</p> : null}
      {errorMessage ? (
        <p className="mb-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">{errorMessage}</p>
      ) : null}
      <div className="space-y-3">
        <button
          className="h-12 w-full rounded-md border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          disabled={pendingProvider !== null}
          onClick={() => void handleLogin("google")}
        >
          {pendingProvider === "google" ? "Google로 이동 중..." : "Google로 계속하기"}
        </button>
        <button
          className="h-12 w-full rounded-md bg-[#FEE500] text-sm font-semibold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          disabled={pendingProvider !== null}
          onClick={() => void handleLogin("kakao")}
        >
          {pendingProvider === "kakao" ? "Kakao로 이동 중..." : "Kakao로 계속하기"}
        </button>
      </div>
    </main>
  );
}
