"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp, Plus } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { PlantForm } from "@/components/PlantForm";
import { usePlantData } from "@/components/AppProviders";
import { PlantAvatar } from "@/components/PlantAvatar";
import { todayISO } from "@/lib/date";
import { getNextWateringDate } from "@/lib/watering";

type SortMode = "needs" | "name";

export function PlantList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState<SortMode>("needs");
  const [adding, setAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { plants, wateringLogs, isDemo } = usePlantData();
  const today = todayISO();
  const sortedPlants = useMemo(() => {
    return [...plants].sort((a, b) => {
      if (sort === "name") return a.nickname.localeCompare(b.nickname, "ko");
      return getNextWateringDate(a, wateringLogs).localeCompare(getNextWateringDate(b, wateringLogs));
    });
  }, [plants, sort, wateringLogs]);
  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 1400);
  };

  useEffect(() => {
    if (searchParams.get("toast") !== "deleted") return;
    showToast("삭제되었습니다");
    router.replace("/plants");
  }, [router, searchParams]);

  return (
    <>
      {isDemo ? (
        <p className="mb-4 rounded-lg border border-neutral-200 bg-white p-4 text-sm leading-6 text-neutral-500">
          <Link className="font-medium text-neutral-900 underline underline-offset-4" href="/login">
            로그인
          </Link>
          전에는 샘플 식물 목록이 보입니다. 로그인 후 추가한 식물은 저장됩니다.
        </p>
      ) : null}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-neutral-200 bg-white p-1">
          <SortButton active={sort === "needs"} onClick={() => setSort("needs")} label="관리 필요순" />
          <SortButton active={sort === "name"} onClick={() => setSort("name")} label="가나다순" />
        </div>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-900 text-white"
          type="button"
          onClick={() => setAdding(true)}
          aria-label="식물 추가"
        >
          <Plus aria-hidden className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2">
        {sortedPlants.map((plant) => {
          const nextDate = getNextWateringDate(plant, wateringLogs);
          return (
            <Link
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition hover:bg-neutral-50"
              href={`/plants/${plant.id}`}
              key={plant.id}
            >
              <PlantAvatar name={plant.nickname} imageUrl={plant.coverImageUrl} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-medium text-neutral-900">{plant.nickname}</h2>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {nextDate <= today ? "오늘 확인" : `${nextDate} 예정`}
                </p>
              </div>
              <ArrowDownUp aria-hidden className="h-4 w-4 text-neutral-300" />
            </Link>
          );
        })}
        {sortedPlants.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm leading-6 text-neutral-500">
            아직 등록한 식물이 없어요. 오른쪽 위 + 버튼으로 첫 식물을 추가해보세요.
          </div>
        ) : null}
      </div>
      {adding ? (
        <BottomSheet title="식물 등록" onClose={() => setAdding(false)}>
          <PlantForm
            variant="sheet"
            onSaved={() => {
              setAdding(false);
              showToast("저장되었습니다");
            }}
          />
        </BottomSheet>
      ) : null}
      {toastMessage ? <Toast message={toastMessage} /> : null}
    </>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {message}
    </div>
  );
}

function SortButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`h-9 rounded px-3 text-sm font-medium transition ${active ? "bg-neutral-100 text-neutral-950" : "text-neutral-500"}`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
