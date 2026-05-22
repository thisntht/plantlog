"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Droplets, Eye, Leaf, Plus } from "lucide-react";
import { usePlantData } from "@/components/AppProviders";
import { PlantAvatar } from "@/components/PlantAvatar";
import { WateringLogFormSheet } from "@/components/WateringLogFormSheet";
import { todayISO } from "@/lib/date";
import { getNextWateringDate, getTodayPlants, getUncheckedPlants, getUpcomingPlants } from "@/lib/watering";
import type { Plant } from "@/lib/types";

export function HomeDashboard() {
  const { plants, wateringLogs, plantSnoozes, isDemo, snoozePlant: saveSnooze } = usePlantData();
  const today = todayISO();
  const todayPlants = getTodayPlants(plants, wateringLogs, plantSnoozes, today);
  const upcoming = getUpcomingPlants(plants, wateringLogs, today);
  const unchecked = getUncheckedPlants(plants, wateringLogs, today);
  const [formPlant, setFormPlant] = useState<Plant | null>(null);
  const [snoozePlant, setSnoozePlant] = useState<Plant | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const showSaved = () => {
    setShowSavedToast(true);
    window.setTimeout(() => setShowSavedToast(false), 1400);
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Link
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          href="/plants/new"
        >
          <Plus aria-hidden className="h-4 w-4" />
          새 식물 등록
        </Link>
      </div>
      <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">오늘 물줄 식물</p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-900">{todayPlants.length}개를 확인하면 돼요</h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-700">
            <Droplets aria-hidden className="h-5 w-5" />
          </div>
        </div>
        {isDemo ? (
          <p className="mb-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
            <Link className="font-medium text-neutral-900 underline underline-offset-4" href="/login">
              로그인
            </Link>
            하면 내 식물 데이터가 저장되고 기기 간 동기화됩니다.
          </p>
        ) : null}
        <div className="space-y-3">
          {todayPlants.map((plant) => (
            <article className="rounded-lg border border-neutral-200 bg-white p-3" key={plant.id}>
              <div className="flex items-center gap-3">
                <PlantAvatar name={plant.nickname} imageUrl={plant.coverImageUrl} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-neutral-900">{plant.nickname}</h3>
                  <p className="text-sm text-neutral-500">예정일 {getNextWateringDate(plant, wateringLogs)}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className="flex h-10 items-center justify-center gap-2 rounded-md bg-neutral-900 text-sm font-semibold text-white"
                  type="button"
                  onClick={() => setFormPlant(plant)}
                >
                  <Droplets aria-hidden className="h-4 w-4" />
                  물 줬어요
                </button>
                <button
                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white text-sm font-medium text-neutral-700"
                  type="button"
                  onClick={() => setSnoozePlant(plant)}
                >
                  <Eye aria-hidden className="h-4 w-4" />
                  지켜볼게요
                </button>
              </div>
            </article>
          ))}
          {todayPlants.length === 0 ? <EmptyState text="오늘은 정해진 물주기가 없어요. 가볍게 둘러봐도 충분해요." /> : null}
        </div>
      </section>

      <section className="mb-6">
        <SectionTitle icon={<CalendarClock className="h-4 w-4" />} title="곧 물줄 식물" />
        <div className="space-y-2">
          {upcoming.map(({ plant, days }) => (
            <CompactPlantRow key={plant.id} plant={plant} meta={days === 1 ? "내일" : "2일 뒤"} />
          ))}
          {upcoming.length === 0 ? <EmptyState text="1~2일 안에 예정된 식물이 없어요." /> : null}
        </div>
      </section>

      <section>
        <SectionTitle icon={<Leaf className="h-4 w-4" />} title="오래 확인하지 않은 식물" />
        <div className="space-y-2">
          {unchecked.map(({ plant, daysSince }) => (
            <CompactPlantRow key={plant.id} plant={plant} meta={`${daysSince}일`} />
          ))}
          {unchecked.length === 0 ? <EmptyState text="최근 기록 흐름이 차분히 이어지고 있어요." /> : null}
        </div>
      </section>

      {formPlant ? (
        <WateringLogFormSheet
          plants={plants}
          selectedPlantId={formPlant.id}
          selectedDate={today}
          onClose={() => setFormPlant(null)}
          onSaved={showSaved}
        />
      ) : null}

      {snoozePlant ? (
        <SnoozeSheet
          plant={snoozePlant}
          onClose={() => setSnoozePlant(null)}
          onSnooze={async (days) => {
            await saveSnooze(snoozePlant.id, days);
            setSnoozePlant(null);
          }}
        />
      ) : null}
      {showSavedToast ? <SavedToast /> : null}
    </>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-800">
      <span className="text-neutral-500">{icon}</span>
      {title}
    </div>
  );
}

function CompactPlantRow({ plant, meta }: { plant: Plant; meta: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
      <PlantAvatar name={plant.nickname} imageUrl={plant.coverImageUrl} size="sm" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">{plant.nickname}</span>
      <span className="text-sm text-neutral-500">{meta}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-neutral-200 bg-white p-4 text-sm leading-6 text-neutral-500">{text}</p>;
}

function SavedToast() {
  return (
    <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      저장되었습니다
    </div>
  );
}

function SnoozeSheet({ plant, onClose, onSnooze }: { plant: Plant; onClose: () => void; onSnooze: (days: number) => Promise<void> }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-neutral-950/25 px-3" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" aria-label="닫기" onClick={onClose} />
      <section className="safe-bottom relative mx-auto w-full max-w-md rounded-t-lg border border-neutral-200 bg-white px-5 pt-5">
        <h2 className="text-lg font-semibold text-neutral-900">{plant.nickname}</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">물주기 기록은 만들지 않고 홈 표시와 알림만 잠시 미룹니다.</p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((day) => (
            <button
              className="h-12 rounded-md border border-neutral-200 bg-white text-sm font-semibold text-neutral-800"
              key={day}
              type="button"
              onClick={() => void onSnooze(day)}
            >
              {day}일 뒤
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
