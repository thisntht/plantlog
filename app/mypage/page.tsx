"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Lock, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BottomSheet } from "@/components/BottomSheet";
import { PageHeader } from "@/components/PageHeader";
import { usePlantData } from "@/components/AppProviders";
import { urlBase64ToUint8Array } from "@/lib/push";
import { profile } from "@/lib/sample-data";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { SupabaseClient } from "@supabase/supabase-js";

const PUSH_ENABLED_STORAGE_KEY = "plantlog:push-enabled";

type PushDebugLine = {
  label: string;
  value: string;
};

function describeError(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "알 수 없는 오류";
  }
}

function shortenEndpoint(endpoint?: string | null) {
  if (!endpoint) return "없음";
  return endpoint.length > 18 ? `...${endpoint.slice(-18)}` : endpoint;
}

function isStandalonePwa() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone);
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), milliseconds);
    })
  ]);
}

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

export default function MyPage() {
  const { user, signOut, isDemo, notificationTime, updateNotificationTime } = usePlantData();
  const [selectedHour, selectedMinute] = notificationTime.split(":");
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [pushState, setPushState] = useState<"idle" | "saving" | "enabled" | "blocked" | "unsupported" | "missing-key">("idle");
  const [toastMessage, setToastMessage] = useState("");
  const [pushDebugLines, setPushDebugLines] = useState<PushDebugLine[]>([]);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 1600);
  };

  const getStoredPushEnabled = () => {
    try {
      return window.localStorage.getItem(PUSH_ENABLED_STORAGE_KEY);
    } catch {
      return null;
    }
  };

  const setStoredPushEnabled = (enabled: boolean) => {
    try {
      window.localStorage.setItem(PUSH_ENABLED_STORAGE_KEY, enabled ? "true" : "false");
    } catch {
      // Local storage can be unavailable in private browsing modes.
    }
  };

  useEffect(() => {
    if (!user) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPushState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setPushState("blocked");
      return;
    }
    if (getStoredPushEnabled() === "false") {
      setPushState("idle");
      return;
    }

    let active = true;
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (active) setPushState(subscription ? "enabled" : "idle");
      })
      .catch(() => {
        if (active) setPushState("idle");
      });

    return () => {
      active = false;
    };
  }, [user]);

  const getReadyRegistration = async (addDebugLine?: (label: string, value: string) => void) => {
    addDebugLine?.("serviceWorker.ready", "대기 중");
    try {
      const registration = await withTimeout(navigator.serviceWorker.ready, 5000, "serviceWorker.ready timeout");
      addDebugLine?.("serviceWorker.ready", "성공");
      return registration;
    } catch (error) {
      addDebugLine?.("serviceWorker.ready 실패", describeError(error));
      addDebugLine?.("serviceWorker.register", "재등록 시도 중");
      const registration = await navigator.serviceWorker.register("/sw.js");
      addDebugLine?.("serviceWorker.register", "성공");
      return registration;
    }
  };

  const getCurrentSession = async (supabase: SupabaseClient, addDebugLine?: (label: string, value: string) => void) => {
    let lastErrorMessage = "";

    const maxAttempts = 10;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        addDebugLine?.("Supabase session", attempt === 1 ? "있음" : `있음 (${attempt}회차)`);
        return session;
      }

      lastErrorMessage = error?.message ?? "";
      addDebugLine?.("Supabase session", `대기 중 (${attempt}/${maxAttempts})${lastErrorMessage ? ` ${lastErrorMessage}` : ""}`);
      await delay(300);
    }

    addDebugLine?.("Supabase session", `없음${lastErrorMessage ? ` (${lastErrorMessage})` : ""}`);
    return null;
  };

  const getPushSubscription = async (publicKey: string, addDebugLine?: (label: string, value: string) => void) => {
    let registration = await getReadyRegistration(addDebugLine);
    const existing = await registration.pushManager.getSubscription();
    addDebugLine?.("getSubscription", existing ? `있음 ${shortenEndpoint(existing.endpoint)}` : "없음");
    if (existing) return existing;

    try {
      addDebugLine?.("subscribe", "시도 중");
      const nextSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      addDebugLine?.("subscribe", `성공 ${shortenEndpoint(nextSubscription.endpoint)}`);
      return nextSubscription;
    } catch (error) {
      console.error("Push subscribe failed. Retrying after service worker registration.", error);
      addDebugLine?.("subscribe 1차 실패", describeError(error));
      addDebugLine?.("serviceWorker.register", "재등록 시도 중");
      registration = await navigator.serviceWorker.register("/sw.js");
      addDebugLine?.("serviceWorker.register", "성공");
      const retrySubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      addDebugLine?.("subscribe 재시도", `성공 ${shortenEndpoint(retrySubscription.endpoint)}`);
      return retrySubscription;
    }
  };

  const enablePush = async () => {
    const debugLines: PushDebugLine[] = [];
    const addDebugLine = (label: string, value: string) => {
      debugLines.push({ label, value });
      setPushDebugLines([...debugLines]);
    };

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    addDebugLine("VAPID public key", publicKey ? "있음" : "없음");
    if (!publicKey) {
      setPushState("missing-key");
      showToast("푸시 알림 키 설정이 필요해요.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPushState("unsupported");
      addDebugLine("지원 여부", `serviceWorker=${"serviceWorker" in navigator}, PushManager=${"PushManager" in window}, Notification=${"Notification" in window}`);
      showToast("이 브라우저에서는 푸시 알림을 지원하지 않아요.");
      return;
    }
    if (!user) {
      setPushState("idle");
      showToast("로그인이 필요해요.");
      return;
    }

    setPushState("saving");
    addDebugLine("지원 여부", "지원됨");
    addDebugLine("standalone", isStandalonePwa() ? "예" : "아니오");
    addDebugLine("permission 이전", Notification.permission);
    const permission = await Notification.requestPermission();
    addDebugLine("permission 이후", permission);
    if (permission !== "granted") {
      setPushState("blocked");
      showToast("브라우저 알림 권한이 꺼져 있어요.");
      return;
    }

    let subscription: PushSubscription;
    try {
      subscription = await getPushSubscription(publicKey, addDebugLine);
    } catch (error) {
      console.error("Failed to create push subscription", error);
      addDebugLine("구독 생성 실패", describeError(error));
      setPushState("idle");
      showToast("푸시 알림을 켜지 못했어요.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      addDebugLine("Supabase 설정", "없음");
      setPushState("idle");
      showToast("Supabase 설정을 확인하지 못했어요.");
      return;
    }
    const session = await getCurrentSession(supabase, addDebugLine);
    if (!session) {
      setPushState("idle");
      showToast("로그인 세션을 확인하지 못했어요.");
      return;
    }

    addDebugLine("API 저장", "요청 중");
    const saveResponse = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(subscription)
    });
    const saveResult = await saveResponse.json().catch(() => null);
    addDebugLine("API 저장 응답", `${saveResponse.status} ${saveResponse.ok ? "OK" : saveResult?.error ?? "실패"}`);
    if (!saveResponse.ok) {
      console.error("Failed to save push subscription", saveResult);
      setPushState("idle");
      showToast("푸시 알림을 저장하지 못했어요.");
      return;
    }

    setStoredPushEnabled(true);
    setPushState("enabled");
    showToast("푸시 알림이 켜졌어요.");
  };

  const runPushDiagnostics = async () => {
    const debugLines: PushDebugLine[] = [];
    const addDebugLine = (label: string, value: string) => {
      debugLines.push({ label, value });
      setPushDebugLines([...debugLines]);
    };

    addDebugLine("user", user ? "있음" : "없음");
    addDebugLine("serviceWorker", "serviceWorker" in navigator ? "지원" : "미지원");
    addDebugLine("PushManager", "PushManager" in window ? "지원" : "미지원");
    addDebugLine("Notification", "Notification" in window ? Notification.permission : "미지원");
    addDebugLine("standalone", isStandalonePwa() ? "예" : "아니오");

    let endpoint: string | null = null;
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await getReadyRegistration(addDebugLine);
        const subscription = await registration.pushManager.getSubscription();
        endpoint = subscription?.endpoint ?? null;
        addDebugLine("getSubscription", subscription ? `있음 ${shortenEndpoint(subscription.endpoint)}` : "없음");
      } catch (error) {
        addDebugLine("serviceWorker/getSubscription 실패", describeError(error));
      }
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      addDebugLine("Supabase 설정", "없음");
      return;
    }
    const session = await getCurrentSession(supabase, addDebugLine);
    if (!session) return;

    try {
      const response = await fetch("/api/push/debug", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ endpoint })
      });
      const result = await response.json().catch(() => null);
      addDebugLine("debug API", `${response.status} ${response.ok ? "OK" : result?.error ?? "실패"}`);
      if (result?.env) addDebugLine("서버 env", `url=${result.env.supabaseUrl}, service=${result.env.serviceRoleKey}, vapid=${result.env.vapidPublicKey}`);
      if (result?.subscriptions) {
        addDebugLine("DB 구독 수", String(result.subscriptions.userCount));
        addDebugLine("현재 endpoint DB", result.subscriptions.endpointFound ? "있음" : "없음");
      }
    } catch (error) {
      addDebugLine("debug API 실패", describeError(error));
    }
  };

  const disablePush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setStoredPushEnabled(false);
    setPushState("idle");

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription || !user) {
      showToast("푸시 알림이 꺼졌어요.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      showToast("푸시 알림이 꺼졌어요.");
      return;
    }
    const session = await getCurrentSession(supabase);
    if (session?.access_token) {
      const response = await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      if (!response.ok) console.error("Failed to delete push subscription", await response.json().catch(() => null));
    }

    showToast("푸시 알림이 꺼졌어요.");
  };

  return (
    <AppShell>
      <PageHeader title="마이페이지" description="알림 시간과 개인 설정을 관리합니다." />
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-700">
            <UserRound aria-hidden className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900">{user?.email ?? profile.displayName}</h2>
            <p className="text-sm text-neutral-500">{user ? "동기화 중" : "샘플 데이터 모드"}</p>
          </div>
        </div>
      </section>
      {isDemo ? (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm leading-6 text-neutral-500">로그인하면 식물과 물주기 기록이 저장됩니다.</p>
          <Link className="mt-3 flex h-11 items-center justify-center rounded-md bg-neutral-900 text-sm font-semibold text-white" href="/login">
            로그인
          </Link>
        </div>
      ) : null}
      <section className="mt-4 space-y-2">
        <button className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-left" type="button" onClick={() => setTimeSheetOpen(true)}>
          <span className="text-neutral-500">
            <Bell className="h-4 w-4" />
          </span>
          <span className="flex-1 text-sm font-medium text-neutral-800">알림 시간</span>
          <span className="font-mono text-sm text-neutral-500">{notificationTime}</span>
        </button>
        {user ? (
          <div className="rounded-lg border border-neutral-200 bg-white">
            <button
              className="flex w-full items-center gap-3 p-4 text-left disabled:opacity-60"
              type="button"
              disabled={pushState === "saving"}
              onClick={() => (pushState === "enabled" ? void disablePush() : void enablePush())}
            >
              <span className="text-neutral-500">
                <Bell className="h-4 w-4" />
              </span>
              <span className="flex-1 text-sm font-medium text-neutral-800">푸시 알림</span>
              <span className="text-sm text-neutral-500">
                {pushState === "saving" ? "설정 중" : pushState === "enabled" ? "켜짐" : pushState === "blocked" ? "차단됨" : "꺼짐"}
              </span>
            </button>
            <div className="border-t border-neutral-100 px-4 pb-4">
              <button className="mt-3 h-9 rounded-md border border-neutral-200 px-3 text-xs font-medium text-neutral-600" type="button" onClick={() => void runPushDiagnostics()}>
                푸시 진단
              </button>
              {pushDebugLines.length > 0 ? (
                <dl className="mt-3 space-y-1 rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
                  {pushDebugLines.map((line, index) => (
                    <div className="grid grid-cols-[6.5rem_1fr] gap-2" key={`${line.label}-${index}`}>
                      <dt className="font-medium text-neutral-500">{line.label}</dt>
                      <dd className="break-words text-neutral-800">{line.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </div>
        ) : null}
        <SettingRow icon={<Lock className="h-4 w-4" />} label="공개 여부" value={profile.isPublic ? "공개" : "비공개"} />
      </section>
      {user ? (
        <button className="mt-4 h-12 w-full rounded-lg bg-neutral-900 text-sm font-semibold text-white" type="button" onClick={() => setLogoutConfirmOpen(true)}>
          로그아웃
        </button>
      ) : null}
      {timeSheetOpen ? (
        <NotificationTimeSheet
          hour={selectedHour ?? "20"}
          minute={selectedMinute ?? "00"}
          onChange={(time) => void updateNotificationTime(time)}
          onClose={() => setTimeSheetOpen(false)}
        />
      ) : null}
      {logoutConfirmOpen ? (
        <ConfirmOverlay
          title="로그아웃할까요?"
          description="다시 사용하려면 로그인이 필요합니다."
          confirmLabel="로그아웃"
          onCancel={() => setLogoutConfirmOpen(false)}
          onConfirm={() => {
            setLogoutConfirmOpen(false);
            void signOut();
          }}
        />
      ) : null}
      {toastMessage ? <Toast message={toastMessage} /> : null}
    </AppShell>
  );
}

function NotificationTimeSheet({
  hour,
  minute,
  onChange,
  onClose
}: {
  hour: string;
  minute: string;
  onChange: (time: string) => void;
  onClose: () => void;
}) {
  const hours = useMemo(() => Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0")), []);
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0")), []);

  const selectHour = (nextHour: string) => onChange(`${nextHour}:${minute}`);
  const selectMinute = (nextMinute: string) => onChange(`${hour}:${nextMinute}`);

  return (
    <BottomSheet title="알림 시간" onClose={onClose}>
      <div className="pb-2">
        <div className="mb-4 text-center font-mono text-xl font-semibold text-neutral-900">
          {hour}:{minute}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TimeColumn label="시" options={hours} selected={hour} onSelect={selectHour} />
          <span className="pt-6 text-sm font-semibold text-neutral-300">:</span>
          <TimeColumn label="분" options={minutes} selected={minute} onSelect={selectMinute} />
        </div>
      </div>
    </BottomSheet>
  );
}

function TimeColumn({
  label,
  options,
  selected,
  onSelect
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-center text-xs font-medium text-neutral-400">{label}</p>
      <div className="h-28 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50 p-1">
        <div className="space-y-1">
          {options.map((option) => (
            <button
              className={`h-8 w-full rounded text-sm transition ${
                selected === option ? "bg-white font-semibold text-neutral-950 shadow-[0_0_0_1px_rgba(212,212,212,1)]" : "text-neutral-500 hover:bg-white"
              }`}
              key={option}
              type="button"
              onClick={() => onSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
      <span className="text-neutral-500">{icon}</span>
      <span className="flex-1 text-sm font-medium text-neutral-800">{label}</span>
      <span className="text-sm text-neutral-500">{value}</span>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[70] -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {message}
    </div>
  );
}

function ConfirmOverlay({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/25 px-5 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-4 shadow-[0_12px_35px_rgba(0,0,0,0.08)]">
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="h-10 rounded-md border border-neutral-200 text-sm font-medium text-neutral-700" type="button" onClick={onCancel}>
            취소
          </button>
          <button className="h-10 rounded-md border border-red-100 bg-white text-sm font-semibold text-red-500" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
