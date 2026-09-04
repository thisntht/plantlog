"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { usePlantData } from "@/components/AppProviders";
import { useBodyScrollLock } from "@/components/BottomSheet";
import { Card, CardContent } from "@/components/ui/card";

export function LoginDialog({ onClose }: { onClose: () => void }) {
  const { signInWithGoogle, signInWithKakao, user, isDemo } = usePlantData();
  const [pendingProvider, setPendingProvider] = useState<"google" | "kakao" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  useBodyScrollLock();

  const handleLogin = async (provider: "google" | "kakao") => {
    setErrorMessage("");
    setPendingProvider(provider);
    try {
      if (provider === "google") await signInWithGoogle();
      else await signInWithKakao();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
      setPendingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-neutral-950/35 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="login-dialog-title">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="로그인 창 닫기" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-sm rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
        <CardContent className="p-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900" id="login-dialog-title">PlantLog</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">식물을 압박감 없이 관찰하고, 물주기 패턴을 조용히 쌓아가는 개인용 기록 앱.</p>
            </div>
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100" type="button" onClick={onClose} aria-label="닫기">
              <X aria-hidden className="h-5 w-5" />
            </button>
          </div>
          {user ? <p className="mt-5 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">이미 로그인되어 있어요.</p> : null}
          {isDemo ? <p className="mt-5 rounded-lg bg-neutral-50 px-3 py-2 text-sm leading-6 text-neutral-500">Google 또는 Kakao 로그인으로 내 식물과 기록을 저장할 수 있습니다.</p> : null}
          {errorMessage ? <p className="mt-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">{errorMessage}</p> : null}
          <div className="mt-5 space-y-3">
            <button className="h-11 w-full rounded-lg border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled={pendingProvider !== null} onClick={() => void handleLogin("google")}>
              {pendingProvider === "google" ? "Google로 이동 중..." : "Google로 계속하기"}
            </button>
            <button className="h-11 w-full rounded-lg bg-[#FEE500] text-sm font-semibold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled={pendingProvider !== null} onClick={() => void handleLogin("kakao")}>
              {pendingProvider === "kakao" ? "Kakao로 이동 중..." : "Kakao로 계속하기"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
