"use client";

import { useMemo, useRef, useState } from "react";
import { addMonths, format, getDay } from "date-fns";
import { Plus } from "lucide-react";
import { usePlantData } from "@/components/AppProviders";
import { BottomSheet } from "@/components/BottomSheet";
import { WateringLogDetailSheet } from "@/components/WateringLogDetailSheet";
import { WateringLogFormSheet } from "@/components/WateringLogFormSheet";
import { buildMonthBuckets } from "@/lib/watering";
import type { DateBucket, Plant, WateringLog } from "@/lib/types";

export function MonthlyCalendar() {
  const { plants, wateringLogs } = usePlantData();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<DateBucket | null>(null);
  const [selectedLog, setSelectedLog] = useState<WateringLog | null>(null);
  const [adding, setAdding] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const wheelLockRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const buckets = useMemo(() => buildMonthBuckets(month, plants, wateringLogs), [month]);
  const leading = buckets[0] ? getDay(new Date(`${buckets[0].date}T00:00:00`)) : 0;
  const trailing = (7 - ((leading + buckets.length) % 7)) % 7;
  const calendarCells: Array<DateBucket | null> = [
    ...Array.from({ length: leading }, () => null),
    ...buckets,
    ...Array.from({ length: trailing }, () => null)
  ];
  const selectedLogPlant = selectedLog ? plants.find((plant) => plant.id === selectedLog.plantId) : null;

  const moveMonth = (amount: number) => setMonth((current) => addMonths(current, amount));
  const handleSwipeEnd = (clientX: number) => {
    if (touchStartX === null) return;
    const distance = clientX - touchStartX;
    if (Math.abs(distance) > 48) moveMonth(distance < 0 ? 1 : -1);
    setTouchStartX(null);
  };
  const handleWheel = (deltaX: number, deltaY: number) => {
    if (Math.abs(deltaX) < 32 || Math.abs(deltaX) < Math.abs(deltaY) || wheelLockRef.current) return;
    moveMonth(deltaX > 0 ? 1 : -1);
    wheelLockRef.current = window.setTimeout(() => {
      wheelLockRef.current = null;
    }, 500);
  };

  return (
    <>
      <section
        className="rounded-lg border border-neutral-200 bg-white"
        onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => handleSwipeEnd(event.changedTouches[0]?.clientX ?? 0)}
        onWheel={(event) => handleWheel(event.deltaX, event.deltaY)}
      >
        <div className="relative flex min-h-14 items-center justify-center border-b border-neutral-200 px-4">
          <button
            className="rounded-md px-3 py-2 text-lg font-semibold text-neutral-900 hover:bg-neutral-50"
            type="button"
            onClick={() => setShowMonthPicker((current) => !current)}
          >
            {format(month, "yyyy.MM")}
          </button>
          {showMonthPicker ? (
            <input
              aria-label="년월 선택"
              className="absolute left-1/2 top-12 z-10 h-10 -translate-x-1/2 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
              type="month"
              value={format(month, "yyyy-MM")}
              onChange={(event) => {
                const [year, monthValue] = event.target.value.split("-").map(Number);
                if (year && monthValue) setMonth(new Date(year, monthValue - 1, 1));
                setShowMonthPicker(false);
              }}
            />
          ) : null}
        </div>

        <div className="grid grid-cols-7 text-center text-[0.72rem] font-medium text-neutral-400">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div className="border-b border-neutral-200 py-2" key={day}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 overflow-hidden">
          {calendarCells.map((bucket, index) => {
            const day = bucket ? Number(bucket.date.slice(-2)) : null;
            return (
              <button
                className="min-h-20 border-b border-r border-neutral-200 bg-white p-1.5 text-left align-top transition hover:bg-neutral-50 [&:nth-child(7n)]:border-r-0"
                key={bucket?.date ?? `blank-${index}`}
                type="button"
                disabled={!bucket}
                onClick={() => bucket && setSelected(bucket)}
              >
                {bucket ? (
                  <>
                    <span className="block text-center text-xs font-semibold text-neutral-700">{day}</span>
                    <CalendarItems bucket={bucket} plants={plants} />
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {selected && !adding ? (
        <BottomSheet title={selected.date} onClose={() => setSelected(null)}>
          <DateSheetContent
            bucket={selected}
            plants={plants}
            onAdd={() => setAdding(true)}
            onSelectLog={(log) => {
              setSelectedLog(log);
              setSelected(null);
            }}
          />
        </BottomSheet>
      ) : null}

      {selectedLog && selectedLogPlant ? (
        <WateringLogDetailSheet
          log={selectedLog}
          plant={selectedLogPlant}
          onClose={() => setSelectedLog(null)}
        />
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

function CalendarItems({ bucket, plants }: { bucket: DateBucket; plants: Plant[] }) {
  const visibleActual = bucket.actualLogs.slice(0, 2);
  const showScheduled = bucket.actualLogs.length === 0 ? bucket.scheduledPlants.slice(0, 2) : [];
  const remaining = bucket.actualLogs.length + bucket.scheduledPlants.length - visibleActual.length - showScheduled.length;

  return (
    <div className="mt-1 space-y-0.5">
      {visibleActual.map((log) => (
        <p className="truncate text-[0.64rem] font-semibold text-neutral-800" key={log.id}>
          {getPlantName(log, plants)}
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

function DateSheetContent({
  bucket,
  plants,
  onAdd,
  onSelectLog
}: {
  bucket: DateBucket;
  plants: Plant[];
  onAdd: () => void;
  onSelectLog: (log: WateringLog) => void;
}) {
  return (
    <div className="space-y-5 pb-16">
      <LogGroup title="기록" logs={bucket.actualLogs} plants={plants} onSelectLog={onSelectLog} />
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
        className="absolute bottom-[max(1.3rem,env(safe-area-inset-bottom))] right-5 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white"
        type="button"
        aria-label="기록 추가"
        onClick={onAdd}
      >
        <Plus aria-hidden className="h-5 w-5" />
      </button>
    </div>
  );
}

function LogGroup({
  title,
  logs,
  plants,
  onSelectLog
}: {
  title: string;
  logs: WateringLog[];
  plants: Plant[];
  onSelectLog: (log: WateringLog) => void;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-neutral-800">{title}</h3>
      <div className="space-y-2">
        {logs.map((log) => (
          <button
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-medium text-neutral-900 hover:bg-neutral-50"
            key={log.id}
            type="button"
            onClick={() => onSelectLog(log)}
          >
            {getPlantName(log, plants)}
          </button>
        ))}
        {logs.length === 0 ? <p className="text-sm text-neutral-400">기록이 없어요.</p> : null}
      </div>
    </section>
  );
}

function getPlantName(log: WateringLog, plants: Plant[]) {
  return plants.find((plant) => plant.id === log.plantId)?.nickname ?? "식물";
}
