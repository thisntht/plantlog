"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { Bell, Lock, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { usePlantData } from "@/components/AppProviders";
import { profile } from "@/lib/sample-data";

export default function MyPage() {
  const { user, signOut, isDemo, notificationTime, updateNotificationTime } = usePlantData();
  const [selectedHour, selectedMinute] = notificationTime.split(":");

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
        <NotificationTimePicker
          hour={selectedHour ?? "20"}
          minute={selectedMinute ?? "00"}
          onChange={(time) => void updateNotificationTime(time)}
        />
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

function NotificationTimePicker({
  hour,
  minute,
  onChange
}: {
  hour: string;
  minute: string;
  onChange: (time: string) => void;
}) {
  const hours = useMemo(() => Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0")), []);
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0")), []);

  const selectHour = (nextHour: string) => onChange(`${nextHour}:${minute}`);
  const selectMinute = (nextMinute: string) => onChange(`${hour}:${nextMinute}`);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-neutral-500">
          <Bell className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-800">알림 시간</p>
          <p className="mt-0.5 text-xs text-neutral-400">24시간 기준</p>
        </div>
        <span className="font-mono text-sm font-medium text-neutral-900">
          {hour}:{minute}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TimeColumn label="시" options={hours} selected={hour} onSelect={selectHour} />
        <span className="pt-6 text-sm font-semibold text-neutral-300">:</span>
        <TimeColumn label="분" options={minutes} selected={minute} onSelect={selectMinute} />
      </div>
    </div>
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
