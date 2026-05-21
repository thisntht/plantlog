"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, Plus } from "lucide-react";
import { PlantAvatar } from "@/components/PlantAvatar";
import { plants, wateringLogs } from "@/lib/sample-data";
import { todayISO } from "@/lib/date";
import { getNextWateringDate } from "@/lib/watering";

type SortMode = "needs" | "name";

export function PlantList() {
  const [sort, setSort] = useState<SortMode>("needs");
  const today = todayISO();
  const sortedPlants = useMemo(() => {
    return [...plants].sort((a, b) => {
      if (sort === "name") return a.nickname.localeCompare(b.nickname, "ko");
      return getNextWateringDate(a, wateringLogs).localeCompare(getNextWateringDate(b, wateringLogs));
    });
  }, [sort]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-white p-1 shadow-[0_8px_25px_rgba(35,55,40,0.05)]">
          <SortButton active={sort === "needs"} onClick={() => setSort("needs")} label="관리 필요순" />
          <SortButton active={sort === "name"} onClick={() => setSort("name")} label="가나다순" />
        </div>
        <Link className="flex h-10 w-10 items-center justify-center rounded-lg bg-leaf-700 text-white" href="/plants/new" aria-label="식물 추가">
          <Plus aria-hidden className="h-5 w-5" />
        </Link>
      </div>

      <div className="space-y-2">
        {sortedPlants.map((plant) => {
          const nextDate = getNextWateringDate(plant, wateringLogs);
          return (
            <Link
              className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-[0_8px_25px_rgba(35,55,40,0.05)] transition hover:bg-leaf-50/60"
              href={`/plants/${plant.id}`}
              key={plant.id}
            >
              <PlantAvatar name={plant.nickname} imageUrl={plant.coverImageUrl} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-medium text-neutral-900">{plant.nickname}</h2>
                <p className="mt-0.5 text-sm text-neutral-500">{nextDate <= today ? "오늘 확인" : `${nextDate} 예정`}</p>
              </div>
              <ArrowDownUp aria-hidden className="h-4 w-4 text-neutral-300" />
            </Link>
          );
        })}
      </div>
    </>
  );
}

function SortButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`h-9 rounded-md px-3 text-sm font-medium transition ${active ? "bg-leaf-50 text-leaf-800" : "text-neutral-500"}`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
