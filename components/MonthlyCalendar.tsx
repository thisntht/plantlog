"use client";

import { useMemo, useState } from "react";
import { addMonths, format, getDay, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { WateringLogFormSheet } from "@/components/WateringLogFormSheet";
import { plants, wateringLogs } from "@/lib/sample-data";
import { buildMonthBuckets } from "@/lib/watering";
import type { DateBucket, WateringLog } from "@/lib/types";

export function MonthlyCalendar() {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<DateBucket | null>(null);
  const [adding, setAdding] = useState(false);
  const buckets = useMemo(() => buildMonthBuckets(month, plants, wateringLogs), [month]);
  const leading = buckets[0] ? getDay(new Date(`${buckets[0].date}T00:00:00`)) : 0;

  return (
    <>
      <section className="rounded-2xl bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
            type="button"
            aria-label="이전 달"
            onClick={() => setMonth((current) => subMonths(current, 1))}
          >
            <ChevronLeft aria-hidden className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-neutral-900">{format(month, "yyyy.MM")}</h2>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
            type="button"
            aria-label="다음 달"
            onClick={() => setMonth((current) => addMonths(current, 1))}
          >
            <ChevronRight aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[0.72rem] font-medium text-neutral-400">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div className="py-1" key={day}>
              {day}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: leading }).map((_, index) => (
            <div className="min-h-20 rounded-lg bg-neutral-50/60" key={`blank-${index}`} />
          ))}
          {buckets.map((bucket) => {
            const day = Number(bucket.date.slice(-2));
            return (
              <button
                className="min-h-20 rounded-lg border border-neutral-100 bg-white p-1.5 text-left transition hover:border-leaf-200 hover:bg-leaf-50/50"
                key={bucket.date}
                type="button"
                onClick={() => setSelected(bucket)}
              >
                <span className="text-xs font-semibold text-neutral-700">{day}</span>
                <CalendarItems bucket={bucket} />
              </button>
            );
          })}
        </div>
      </section>

      {selected && !adding ? (
        <BottomSheet title={selected.date} onClose={() => setSelected(null)}>
          <DateSheetContent bucket={selected} onAdd={() => setAdding(true)} />
        </BottomSheet>
      ) : null}

      {selected && adding ? (
        <WateringLogFormSheet
          plants={plants}
          selectedDate={selected.date}
          onClose={() => setAdding(false)}
          onSaved={() => setSelected(selected)}
        />
      ) : null}
    </>
  );
}

function CalendarItems({ bucket }: { bucket: DateBucket }) {
  const visibleActual = bucket.actualLogs.slice(0, 2);
  const showScheduled = bucket.actualLogs.length === 0 ? bucket.scheduledPlants.slice(0, 2) : [];
  const remaining = bucket.actualLogs.length + bucket.scheduledPlants.length - visibleActual.length - showScheduled.length;

  return (
    <div className="mt-1 space-y-0.5">
      {visibleActual.map((log) => (
        <p className="truncate text-[0.64rem] font-semibold text-neutral-800" key={log.id}>
          {getPlantName(log)}
        </p>
      ))}
      {showScheduled.map((plant) => (
        <p className="truncate text-[0.64rem] text-neutral-400" key={plant.id}>
          {plant.nickname}
        </p>
      ))}
      {remaining > 0 ? <p className="text-[0.64rem] font-medium text-neutral-400">+{remaining}</p> : null}
    </div>
  );
}

function DateSheetContent({ bucket, onAdd }: { bucket: DateBucket; onAdd: () => void }) {
  return (
    <div className="space-y-5 pb-16">
      <LogGroup title="실제 기록" logs={bucket.actualLogs} />
      <section>
        <h3 className="mb-2 text-sm font-semibold text-neutral-800">예정된 물주기</h3>
        <div className="space-y-2">
          {bucket.scheduledPlants.map((plant) => (
            <div className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-500" key={plant.id}>
              {plant.nickname}
            </div>
          ))}
          {bucket.scheduledPlants.length === 0 ? <p className="text-sm text-neutral-400">예정된 물주기가 없어요.</p> : null}
        </div>
      </section>
      <button
        className="absolute bottom-[max(1.3rem,env(safe-area-inset-bottom))] right-5 flex h-12 w-12 items-center justify-center rounded-full bg-leaf-700 text-white shadow-soft"
        type="button"
        aria-label="기록 추가"
        onClick={onAdd}
      >
        <Plus aria-hidden className="h-5 w-5" />
      </button>
    </div>
  );
}

function LogGroup({ title, logs }: { title: string; logs: WateringLog[] }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-neutral-800">{title}</h3>
      <div className="space-y-2">
        {logs.map((log) => (
          <div className="rounded-lg bg-leaf-50 px-3 py-2 text-sm font-medium text-leaf-900" key={log.id}>
            {getPlantName(log)}
          </div>
        ))}
        {logs.length === 0 ? <p className="text-sm text-neutral-400">기록이 없어요.</p> : null}
      </div>
    </section>
  );
}

function getPlantName(log: WateringLog) {
  return plants.find((plant) => plant.id === log.plantId)?.nickname ?? "식물";
}
