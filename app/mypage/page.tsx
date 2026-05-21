import type { ReactNode } from "react";
import { Bell, Lock, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { profile } from "@/lib/sample-data";

export default function MyPage() {
  return (
    <AppShell>
      <PageHeader title="마이페이지" description="알림 시간과 개인 공개 상태를 관리합니다." />
      <section className="rounded-2xl bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700">
            <UserRound aria-hidden className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900">{profile.displayName}</h2>
            <p className="text-sm text-neutral-500">개인 비공개 모드</p>
          </div>
        </div>
      </section>
      <section className="mt-4 space-y-2">
        <SettingRow icon={<Bell className="h-4 w-4" />} label="알림 시간" value={profile.notificationTime} />
        <SettingRow icon={<Lock className="h-4 w-4" />} label="공개 여부" value={profile.isPublic ? "공개" : "비공개"} />
      </section>
    </AppShell>
  );
}

function SettingRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-[0_8px_25px_rgba(35,55,40,0.05)]">
      <span className="text-leaf-700">{icon}</span>
      <span className="flex-1 text-sm font-medium text-neutral-800">{label}</span>
      <span className="text-sm text-neutral-500">{value}</span>
    </div>
  );
}
