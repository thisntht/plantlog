"use client";

import { useMemo, useRef, useState } from "react";
import { addDays, addMonths, format, getDay } from "date-fns";
import { ChevronRight, Plus } from "lucide-react";
import { usePlantData } from "@/components/AppProviders";
import { BottomSheet, useBodyScrollLock } from "@/components/BottomSheet";
import { WateringLogDetailSheet } from "@/components/WateringLogDetailSheet";
import { WateringLogFormSheet } from "@/components/WateringLogFormSheet";
import { dateToISO, todayISO } from "@/lib/date";
import { buildMonthBuckets } from "@/lib/watering";
import type { DateBucket, Plant, WateringLog } from "@/lib/types";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const logTypeLabels = {
  watering: "물주기",
  repotting: "분갈이",
  fertilizing: "비료"
} as const;
const logTypeDotClass = {
  watering: "bg-neutral-900",
  repotting: "bg-neutral-500",
  fertilizing: "bg-neutral-300"
} as const;

export function MonthlyCalendar() {
  const { plants, wateringLogs, plantSnoozes } = usePlantData();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<DateBucket | null>(null);
  const [selectedLog, setSelectedLog] = useState<WateringLog | null>(null);
  const [adding, setAdding] = useState(false);
  const [addingPlantId, setAddingPlantId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [sheetTouchStart, setSheetTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const wheelLockRef = useRef<number | null>(null);
  const buckets = useMemo(() => buildMonthBuckets(month, plants, wateringLogs, plantSnoozes), [month, plants, plantSnoozes, wateringLogs]);
  const leading = buckets[0] ? getDay(new Date(`${buckets[0].date}T00:00:00`)) : 0;
  const trailing = (7 - ((leading + buckets.length) % 7)) % 7;
  const today = todayISO();
  const calendarCells: Array<DateBucket | null> = [
    ...Array.from({ length: leading }, () => null),
    ...buckets,
    ...Array.from({ length: trailing }, () => null)
  ];
  const selectedLogPlant = selectedLog ? plants.find((plant) => plant.id === selectedLog.plantId) : null;

  const selectDate = (date: Date) => {
    const targetBuckets = buildMonthBuckets(date, plants, wateringLogs, plantSnoozes);
    const targetDate = dateToISO(date);
    setMonth(date);
    setSelected(targetBuckets.find((bucket) => bucket.date === targetDate) ?? null);
  };

  const moveMonth = (amount: number) => setMonth((current) => addMonths(current, amount));
  const handleSwipeEnd = (clientX: number, clientY: number) => {
    if (!touchStart) return;
    const distanceX = clientX - touchStart.x;
    const distanceY = clientY - touchStart.y;
    if (Math.abs(distanceX) > 56 && Math.abs(distanceX) > Math.abs(distanceY) * 1.5) {
      moveMonth(distanceX < 0 ? 1 : -1);
    }
    setTouchStart(null);
  };
  const handleWheel = (deltaX: number, deltaY: number) => {
    if (Math.abs(deltaX) < 32 || Math.abs(deltaX) < Math.abs(deltaY) || wheelLockRef.current) return;
    moveMonth(deltaX > 0 ? 1 : -1);
    wheelLockRef.current = window.setTimeout(() => {
      wheelLockRef.current = null;
    }, 500);
  };
  const moveSelectedDate = (amount: number) => {
    if (!selected) return;
    selectDate(addDays(new Date(`${selected.date}T00:00:00`), amount));
  };
  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 1400);
  };
  const handleLogSaved = (log: WateringLog | null) => {
    showToast("저장되었습니다");
    if (!selected) return;

    const nextLogs = log ? [...wateringLogs.filter((item) => item.id !== log.id), log] : wateringLogs;
    const nextBucket = buildMonthBuckets(new Date(`${selected.date}T00:00:00`), plants, nextLogs, plantSnoozes).find((bucket) => bucket.date === selected.date);
    setSelected(nextBucket ?? selected);
  };
  const handleSheetSwipeEnd = (clientX: number, clientY: number) => {
    if (!sheetTouchStart) return;
    const distanceX = clientX - sheetTouchStart.x;
    const distanceY = clientY - sheetTouchStart.y;
    if (distanceY > 72 && distanceY > Math.abs(distanceX) * 1.25) {
      setSelected(null);
    } else if (Math.abs(distanceX) > 56 && Math.abs(distanceX) > Math.abs(distanceY) * 1.5) {
      moveSelectedDate(distanceX < 0 ? 1 : -1);
    }
    setSheetTouchStart(null);
  };

  return (
    <>
      <header className="mb-3">
        <div>
          <button
            className="inline-flex items-center gap-1 rounded-md py-1 pr-2 text-2xl font-semibold text-neutral-900 hover:bg-neutral-50"
            type="button"
            onClick={() => setMonthPickerOpen(true)}
          >
            {format(month, "yyyy.MM")}
            <span className="text-sm text-neutral-400">▼</span>
          </button>
        </div>
        <p className="mt-1 text-sm leading-6 text-neutral-500">기록은 진하게, 예정된 물주기는 흐리게 표시됩니다.</p>
      </header>

      <section
        className="-mx-5"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          setTouchStart({ x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 });
        }}
        onTouchEnd={(event) => {
          const touch = event.changedTouches[0];
          handleSwipeEnd(touch?.clientX ?? 0, touch?.clientY ?? 0);
        }}
        onWheel={(event) => handleWheel(event.deltaX, event.deltaY)}
      >
        <div className="grid grid-cols-7 border-b border-neutral-200 text-center text-[0.72rem] font-medium text-neutral-400">
          {weekdays.map((day) => (
            <div className="py-2" key={day}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid animate-[calendar-fade_160ms_ease] grid-cols-7 overflow-hidden" key={format(month, "yyyy-MM")}>
          {calendarCells.map((bucket, index) => {
            const day = bucket ? Number(bucket.date.slice(-2)) : null;
            const isToday = bucket?.date === today;
            return (
              <button
                className="flex min-h-24 flex-col items-stretch justify-start border-b border-r border-neutral-200 bg-white p-1.5 text-left transition hover:bg-neutral-50 [&:nth-child(7n)]:border-r-0"
                key={bucket?.date ?? `blank-${index}`}
                type="button"
                disabled={!bucket}
                onClick={() => bucket && setSelected(bucket)}
              >
                {bucket ? (
                  <>
                    <span
                      className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday ? "bg-neutral-200 text-neutral-950" : "text-neutral-700"
                      }`}
                    >
                      {day}
                    </span>
                    <CalendarItems bucket={bucket} plants={plants} />
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {selected && !adding ? (
        <DateDetailSheet
          bucket={selected}
          plants={plants}
          today={today}
          onAdd={() => {
            setAddingPlantId(null);
            setAdding(true);
          }}
          onClose={() => setSelected(null)}
          onMoveDate={moveSelectedDate}
          onSelectLog={(log) => {
            setSelectedLog(log);
            setSelected(null);
          }}
          onSelectScheduledPlant={(plantId) => {
            setAddingPlantId(plantId);
            setAdding(true);
          }}
          onTouchStart={(point) => setSheetTouchStart(point)}
          onTouchEnd={handleSheetSwipeEnd}
        />
      ) : null}

      {monthPickerOpen ? (
        <MonthPickerSheet
          month={month}
          onClose={() => setMonthPickerOpen(false)}
          onSelect={(nextMonth) => {
            setMonth(nextMonth);
            setMonthPickerOpen(false);
          }}
        />
      ) : null}

      {selectedLog && selectedLogPlant ? (
        <WateringLogDetailSheet
          log={selectedLog}
          plant={selectedLogPlant}
          onClose={() => setSelectedLog(null)}
          onSaved={() => showToast("저장되었습니다")}
          onDeleted={() => showToast("삭제되었습니다")}
        />
      ) : null}

      {selected && adding ? (
        <WateringLogFormSheet
          plants={plants}
          selectedPlantId={addingPlantId ?? undefined}
          selectedDate={selected.date}
          onClose={() => {
            setAdding(false);
            setAddingPlantId(null);
          }}
          onSaved={handleLogSaved}
        />
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

function CalendarItems({ bucket, plants }: { bucket: DateBucket; plants: Plant[] }) {
  const visibleActual = bucket.actualLogs.slice(0, 1);
  const hasActualWatering = bucket.actualLogs.some((log) => log.logType === "watering");
  const showScheduled = hasActualWatering ? [] : bucket.scheduledPlants.slice(0, 1);
  const remaining = bucket.actualLogs.length + bucket.scheduledPlants.length - visibleActual.length - showScheduled.length;

  return (
    <div className="mt-1.5 space-y-1">
      {visibleActual.map((log) => (
        <p className="flex min-w-0 items-center gap-1 truncate text-[0.64rem] font-semibold text-neutral-900" key={log.id}>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${logTypeDotClass[log.logType]}`} />
          <span className="truncate">{getPlantName(log, plants)}</span>
        </p>
      ))}
      {showScheduled.map((plant) => (
        <p className="flex min-w-0 items-center gap-1 truncate text-[0.64rem] text-neutral-400" key={plant.id}>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-neutral-300" />
          <span className="truncate">{plant.nickname}</span>
        </p>
      ))}
      {remaining > 0 ? <p className="pl-2.5 text-[0.64rem] font-medium text-neutral-400">+{remaining}</p> : null}
    </div>
  );
}

function DateDetailSheet({
  bucket,
  plants,
  today,
  onAdd,
  onClose,
  onMoveDate,
  onSelectLog,
  onSelectScheduledPlant,
  onTouchStart,
  onTouchEnd
}: {
  bucket: DateBucket;
  plants: Plant[];
  today: string;
  onAdd: () => void;
  onClose: () => void;
  onMoveDate: (amount: number) => void;
  onSelectLog: (log: WateringLog) => void;
  onSelectScheduledPlant: (plantId: string) => void;
  onTouchStart: (point: { x: number; y: number }) => void;
  onTouchEnd: (clientX: number, clientY: number) => void;
}) {
  const date = new Date(`${bucket.date}T00:00:00`);
  const isToday = bucket.date === today;
  useBodyScrollLock();

  return (
    <div
      className="fixed inset-0 z-50 touch-none overflow-hidden bg-neutral-950/35 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <button className="absolute inset-0 cursor-default" aria-label="닫기" onClick={onClose} />
      <div className="relative z-10 mx-auto flex h-full max-w-md flex-col">
        <div
          className="mb-5 text-white"
          onTouchStart={(event) => {
            const touch = event.touches[0];
            onTouchStart({ x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 });
          }}
          onTouchEnd={(event) => {
            const touch = event.changedTouches[0];
            onTouchEnd(touch?.clientX ?? 0, touch?.clientY ?? 0);
          }}
        >
          <div className="h-6">{isToday ? <p className="text-sm font-bold uppercase tracking-wide">TODAY</p> : null}</div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-end gap-2">
              <h2 className="text-3xl font-bold">{format(date, "M월 d일")}</h2>
              <span className="pb-0.5 text-lg font-medium">{weekdays[getDay(date)]}</span>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-white/85 hover:bg-white/10" type="button" onClick={() => onMoveDate(1)} aria-label="다음 날짜">
              <ChevronRight aria-hidden className="h-6 w-6" />
            </button>
          </div>
        </div>

        <section className="relative min-h-0 flex-1 rounded-[1.6rem] bg-white p-5">
          <div className="max-h-[calc(100%-5rem)] touch-pan-y overflow-y-auto overscroll-contain pb-20">
            <LogGroup title="기록" logs={bucket.actualLogs} plants={plants} onSelectLog={onSelectLog} />
            <section className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-neutral-800">예정된 물주기</h3>
              <div className="space-y-2">
                {bucket.scheduledPlants.map((plant) => (
                  <button
                    className="w-full rounded-lg bg-neutral-50 px-3 py-2 text-left text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
                    key={plant.id}
                    type="button"
                    onClick={() => onSelectScheduledPlant(plant.id)}
                  >
                    {plant.nickname}
                  </button>
                ))}
                {bucket.scheduledPlants.length === 0 ? <p className="py-8 text-center text-lg text-neutral-300">이날의 일정이 없습니다</p> : null}
              </div>
            </section>
          </div>
          <button
            className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
            type="button"
            aria-label="기록 추가"
            onClick={onAdd}
          >
            <Plus aria-hidden className="h-6 w-6" />
          </button>
        </section>
      </div>
    </div>
  );
}

function MonthPickerSheet({
  month,
  onClose,
  onSelect
}: {
  month: Date;
  onClose: () => void;
  onSelect: (month: Date) => void;
}) {
  const currentYear = month.getFullYear();
  const selectedMonth = month.getMonth() + 1;
  const years = useMemo(() => Array.from({ length: 21 }, (_, index) => currentYear - 10 + index), [currentYear]);
  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);

  return (
    <BottomSheet title="년월 선택" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 pb-2">
        <div className="h-56 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50 p-1">
          {years.map((year) => (
            <button
              className={`h-10 w-full rounded text-sm ${year === currentYear ? "bg-white font-semibold text-neutral-950" : "text-neutral-500"}`}
              key={year}
              type="button"
              onClick={() => onSelect(new Date(year, selectedMonth - 1, 1))}
            >
              {year}
            </button>
          ))}
        </div>
        <div className="h-56 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50 p-1">
          {months.map((monthValue) => (
            <button
              className={`h-10 w-full rounded text-sm ${monthValue === selectedMonth ? "bg-white font-semibold text-neutral-950" : "text-neutral-500"}`}
              key={monthValue}
              type="button"
              onClick={() => onSelect(new Date(currentYear, monthValue - 1, 1))}
            >
              {monthValue}월
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
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
            <span className="flex items-center justify-between gap-3">
              <span>{getPlantName(log, plants)}</span>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">{logTypeLabels[log.logType]}</span>
            </span>
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
