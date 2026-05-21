"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, Lock, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { usePlantData } from "@/components/AppProviders";
import { profile } from "@/lib/sample-data";

export default function MyPage() {
  const { user, signOut, isDemo, notificationTime, updateNotificationTime } = usePlantData();

  return (
    <AppShell>
      <PageHeader title="마이페이지" description="알림 시간과 개인 공개 상태를 관리합니다." />
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
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
          <span className="text-neutral-500">
            <Bell className="h-4 w-4" />
          </span>
          <label className="flex flex-1 items-center justify-between gap-3 text-sm font-medium text-neutral-800">
            알림 시간
            <input
              className="h-9 rounded-md border border-neutral-200 bg-white px-2 text-sm text-neutral-700 outline-none focus:border-neutral-500"
              type="time"
              value={notificationTime}
              onChange={(event) => void updateNotificationTime(event.target.value)}
            />
          </label>
        </div>
        <SettingRow icon={<Lock className="h-4 w-4" />} label="공개 여부" value={profile.isPublic ? "공개" : "비공개"} />
      </section>
      {user ? (
        <button className="mt-4 h-12 w-full rounded-lg bg-neutral-900 text-sm font-semibold text-white" type="button" onClick={() => void signOut()}>
          로그아웃
        </button>
      ) : null}
    </AppShell>
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
