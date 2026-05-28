"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Lock, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BottomSheet } from "@/components/BottomSheet";
import { PageHeader } from "@/components/PageHeader";
import { usePlantData } from "@/components/AppProviders";
import { urlBase64ToUint8Array } from "@/lib/push";
import { profile } from "@/lib/sample-data";

export default function MyPage() {
  const { user, signOut, isDemo, notificationTime, updateNotificationTime } = usePlantData();
  const [selectedHour, selectedMinute] = notificationTime.split(":");
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [pushState, setPushState] = useState<"idle" | "saving" | "enabled" | "blocked" | "unsupported" | "missing-key">("idle");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 1600);
  };

  const enablePush = async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setPushState("missing-key");
      showToast("푸시 알림 키 설정이 필요해요.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPushState("unsupported");
      showToast("이 브라우저에서는 푸시 알림을 지원하지 않아요.");
      return;
    }

    setPushState("saving");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushState("blocked");
      showToast("브라우저 알림 권한이 꺼져 있어요.");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      }));

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      setPushState("idle");
      showToast("푸시 알림을 저장하지 못했어요.");
      return;
    }

    setPushState("enabled");
    showToast("푸시 알림이 켜졌어요.");
  };

  const disablePush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      setPushState("idle");
      return;
    }

    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });
    await subscription.unsubscribe();
    setPushState("idle");
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
          <button
            className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-left"
            type="button"
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
          description="다시 사용하려면 Google 로그인이 필요합니다."
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
