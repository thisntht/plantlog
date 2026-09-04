"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addMonths, endOfMonth, format, getDay, startOfMonth } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Droplets, Edit3, ImageIcon, List, Settings2, Trash2, X } from "lucide-react";
import { usePlantData } from "@/components/AppProviders";
import { BottomSheet } from "@/components/BottomSheet";
import { PlantAvatar } from "@/components/PlantAvatar";
import { WateringLogDetailSheet } from "@/components/WateringLogDetailSheet";
import { WateringLogFormSheet } from "@/components/WateringLogFormSheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dateToISO, formatKoreanDate, todayISO } from "@/lib/date";
import { getLastWateredDate, getPlantLogs, getWateringIntervalSuggestion } from "@/lib/watering";
import type { LogType, Plant, WateringLog } from "@/lib/types";

type Tab = "list" | "calendar" | "album";
const logTypeOrder: LogType[] = ["watering", "repotting", "fertilizing"];
const logTypeLabels = {
  watering: "물주기",
  repotting: "분갈이",
  fertilizing: "비료/영양제"
} as const;
const logTypeDotClass = {
  watering: "bg-neutral-900",
  repotting: "bg-neutral-500",
  fertilizing: "bg-neutral-300"
} as const;

export function PlantDetail({ plant }: { plant: Plant }) {
  const router = useRouter();
  const { plants, wateringLogs, loading, updatePlant, deletePlant, uploadPlantCover } = usePlantData();
  const [tab, setTab] = useState<Tab>("list");
  const [logFilter, setLogFilter] = useState<LogType | null>(null);
  const [selectedLog, setSelectedLog] = useState<WateringLog | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingPlant, setEditingPlant] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dismissedSuggestionKey, setDismissedSuggestionKey] = useState<string | null>(null);
  const [applyingSuggestion, setApplyingSuggestion] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const foundPlant = plants.find((item) => item.id === plant.id);
  const activePlant = foundPlant ?? plant;
  const logs = getPlantLogs(activePlant.id, wateringLogs);
  const filteredLogs = logFilter ? logs.filter((log) => log.logType === logFilter) : logs;
  const lastWatered = getLastWateredDate(activePlant.id, wateringLogs);
  const suggestion = getWateringIntervalSuggestion(activePlant, wateringLogs);
  const suggestionKey = suggestion ? `${activePlant.id}:${suggestion.current}:${suggestion.average}:${suggestion.gaps.join(",")}` : null;
  const visibleSuggestion = suggestion && suggestionKey !== dismissedSuggestionKey ? suggestion : null;
  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 1400);
  };
  const removePlant = async () => {
    await deletePlant(activePlant.id);
    router.push("/plants?toast=deleted");
  };
  const applySuggestion = async () => {
    if (!visibleSuggestion) return;

    setApplyingSuggestion(true);
    try {
      await updatePlant(activePlant.id, { wateringIntervalDays: visibleSuggestion.average });
      showToast("물주기 주기를 변경했어요.");
    } catch {
      showToast("주기를 변경하지 못했어요.");
    } finally {
      setApplyingSuggestion(false);
    }
  };

  if (loading && !foundPlant) {
    return <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-500">식물 정보를 불러오는 중이에요.</div>;
  }

  if (!loading && !foundPlant && !plant.userId) {
    return <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-500">식물을 찾지 못했어요. 식물 탭에서 다시 선택해주세요.</div>;
  }

  return (
    <>
      <section className="mb-5 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex justify-end gap-1">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
            type="button"
            aria-label="식물 수정"
            onClick={() => setEditingPlant(true)}
          >
            <Edit3 aria-hidden className="h-4 w-4" />
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
            type="button"
            aria-label="식물 삭제"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 aria-hidden className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-4">
          <PlantAvatar name={activePlant.nickname} imageUrl={activePlant.coverImageUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold text-neutral-900">{activePlant.nickname}</h1>
            <p className="mt-1 truncate text-sm text-neutral-500">{activePlant.scientificName ?? activePlant.plantType ?? "식물"}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <InfoPill label="주기" value={`${activePlant.wateringIntervalDays}일`} />
              <InfoPill label="최근" value={lastWatered ? formatKoreanDate(lastWatered) : "없음"} />
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-neutral-500">{activePlant.memo}</p>
        <button
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-neutral-900 text-sm font-semibold text-white"
          type="button"
          onClick={() => setAdding(true)}
        >
          <Droplets aria-hidden className="h-4 w-4" />
          기록 추가
        </button>
      </section>

      {visibleSuggestion ? (
        <section className="mb-5 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Settings2 aria-hidden className="h-4 w-4" />
            주기 제안
          </div>
          <p className="text-sm leading-6 text-neutral-700">
            최근 기록을 보면 평균 {visibleSuggestion.average}일마다 물을 주고 있어요. 현재 설정은 {visibleSuggestion.current}일이에요. {visibleSuggestion.average}일로
            바꿔볼까요?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="h-10 rounded-md border border-neutral-200 bg-white text-sm font-medium text-neutral-700"
              type="button"
              onClick={() => suggestionKey && setDismissedSuggestionKey(suggestionKey)}
            >
              그대로 둘게요
            </button>
            <button className="h-10 rounded-md bg-neutral-900 text-sm font-semibold text-white disabled:opacity-60" type="button" disabled={applyingSuggestion} onClick={() => void applySuggestion()}>
              {applyingSuggestion ? "변경 중" : `${visibleSuggestion.average}일로 변경`}
            </button>
          </div>
        </section>
      ) : null}

      <Tabs className="mb-3" value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList className="grid w-full grid-cols-3" aria-label="식물 기록 보기">
          <TabsTrigger className="gap-1.5" value="list"><List aria-hidden className="h-4 w-4" />리스트</TabsTrigger>
          <TabsTrigger className="gap-1.5" value="calendar"><CalendarDays aria-hidden className="h-4 w-4" />캘린더</TabsTrigger>
          <TabsTrigger className="gap-1.5" value="album"><ImageIcon aria-hidden className="h-4 w-4" />앨범</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {logTypeOrder.map((type) => {
          const active = logFilter === type;
          return (
            <button
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium leading-4 transition ${
                active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-600"
              }`}
              key={type}
              type="button"
              onClick={() => setLogFilter((current) => (current === type ? null : type))}
            >
              {logTypeLabels[type]}
            </button>
          );
        })}
      </div>

      {tab === "list" ? <LogList logs={filteredLogs} onSelect={setSelectedLog} /> : null}
      {tab === "calendar" ? <PlantMiniCalendar logs={filteredLogs} onSelect={setSelectedLog} /> : null}
      {tab === "album" ? <Album logs={filteredLogs} onSelect={setSelectedLog} /> : null}

      {selectedLog ? (
        <WateringLogDetailSheet
          log={selectedLog}
          plant={activePlant}
          onClose={() => setSelectedLog(null)}
          onSaved={() => showToast("저장되었습니다")}
          onDeleted={() => showToast("삭제되었습니다")}
        />
      ) : null}
      {adding ? (
        <WateringLogFormSheet
          plants={plants}
          selectedPlantId={activePlant.id}
          selectedDate={todayISO()}
          onClose={() => setAdding(false)}
          onSaved={() => showToast("저장되었습니다")}
        />
      ) : null}
      {editingPlant ? (
        <PlantEditSheet
          plant={activePlant}
          onClose={() => setEditingPlant(false)}
          onSave={async (input) => {
            const coverImageUrl = input.coverFile ? await uploadPlantCover(input.coverFile) : input.coverImageUrl;
            await updatePlant(activePlant.id, { ...input, coverImageUrl });
            setEditingPlant(false);
            showToast("저장되었습니다");
          }}
        />
      ) : null}
      {deleteConfirmOpen ? (
        <ConfirmOverlay
          title="식물을 삭제할까요?"
          description="삭제하면 이 식물의 물주기 기록도 함께 삭제됩니다. 이 작업은 되돌릴 수 없어요."
          confirmLabel="삭제"
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={() => void removePlant()}
        />
      ) : null}
      {toastMessage ? <Toast message={toastMessage} /> : null}
    </>
  );
}

function PlantEditSheet({ plant, onClose, onSave }: { plant: Plant; onClose: () => void; onSave: (input: {
  nickname: string;
  wateringIntervalDays: number;
  scientificName?: string;
  plantType?: string;
  startedAt: string;
  memo?: string;
  coverImageUrl?: string;
  coverFile?: File | null;
}) => Promise<void> }) {
  const [nickname, setNickname] = useState(plant.nickname);
  const [wateringIntervalDays, setWateringIntervalDays] = useState(String(plant.wateringIntervalDays));
  const [scientificName, setScientificName] = useState(plant.scientificName ?? "");
  const [plantType, setPlantType] = useState(plant.plantType ?? "");
  const [startedAt, setStartedAt] = useState(plant.startedAt);
  const [memo, setMemo] = useState(plant.memo ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(plant.coverImageUrl ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!nickname.trim()) {
      setError("표시 이름을 입력해주세요.");
      return;
    }

    const interval = Number(wateringIntervalDays);
    if (!Number.isFinite(interval) || interval <= 0) {
      setError("물주기 주기는 1일 이상으로 입력해주세요.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({
        nickname: nickname.trim(),
        wateringIntervalDays: interval,
        scientificName: scientificName.trim(),
        plantType: plantType.trim(),
        startedAt,
        memo: memo.trim(),
        coverImageUrl: plant.coverImageUrl,
        coverFile
      });
    } catch {
      setError("저장하지 못했어요. 잠시 뒤 다시 시도해주세요.");
      setSaving(false);
    }
  };

  return (
    <BottomSheet title="식물 수정" onClose={onClose}>
      <div className="space-y-5">
        <EditField label="표시 이름" required value={nickname} onChange={setNickname} />
        <EditField label="물주기 주기" required type="number" suffix="일" value={wateringIntervalDays} onChange={setWateringIntervalDays} />
        <EditField label="정식 식물명" value={scientificName} onChange={setScientificName} />
        <EditField label="식물 종류" value={plantType} onChange={setPlantType} />
        <EditField label="시작일" type="date" value={startedAt} onChange={setStartedAt} />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">메모</span>
          <textarea
            className="min-h-28 w-full resize-none rounded-md border border-neutral-200 bg-white p-3 text-base outline-none focus:border-neutral-500"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        </label>
        {coverPreview ? <img alt="대표 사진 미리보기" className="aspect-[4/3] w-full rounded-lg object-cover" src={coverPreview} /> : null}
        <label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 text-sm font-medium text-neutral-500">
          대표 사진 변경
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setCoverFile(file);
              setCoverPreview(file ? URL.createObjectURL(file) : plant.coverImageUrl ?? "");
            }}
          />
        </label>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button className="h-12 w-full rounded-md bg-neutral-900 text-sm font-semibold text-white" type="button" onClick={save} disabled={saving}>
          {saving ? "저장 중" : "저장"}
        </button>
      </div>
    </BottomSheet>
  );
}

function EditField({
  label,
  required,
  type = "text",
  suffix,
  value,
  onChange
}: {
  label: string;
  required?: boolean;
  type?: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
        {required ? <span className="text-neutral-900"> *</span> : null}
      </span>
      <div className="flex h-12 w-full items-center overflow-hidden rounded-md border border-neutral-200 bg-white px-3 focus-within:border-neutral-500">
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-base text-neutral-900 outline-none"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? <span className="text-sm text-neutral-400">{suffix}</span> : null}
      </div>
    </label>
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-950/25 px-5">
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

function Toast({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[80] -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {message}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-neutral-50 p-2">
      <p className="text-[0.68rem] text-neutral-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-neutral-800">{value}</p>
    </div>
  );
}

function LogList({ logs, onSelect }: { logs: WateringLog[]; onSelect: (log: WateringLog) => void }) {
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <button className="w-full rounded-lg border border-neutral-200 bg-white p-4 text-left" key={log.id} type="button" onClick={() => onSelect(log)}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-neutral-900">{formatKoreanDate(log.wateredDate)}</p>
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">{logTypeLabels[log.logType]}</span>
          </div>
          {log.memo ? <p className="mt-1 truncate text-sm text-neutral-500">{log.memo}</p> : null}
        </button>
      ))}
      {logs.length === 0 ? <p className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">표시할 기록이 없어요.</p> : null}
    </div>
  );
}

const detailWeekdays = ["일", "월", "화", "수", "목", "금", "토"];

function PlantMiniCalendar({ logs, onSelect }: { logs: WateringLog[]; onSelect: (log: WateringLog) => void }) {
  const [month, setMonth] = useState(new Date());
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const leading = getDay(monthStart);
  const daysInMonth = Number(format(monthEnd, "d"));
  const cells: Array<{ key: string; date?: string; day?: number }> = [
    ...Array.from({ length: leading }, (_, index) => ({ key: `blank-${index}` })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = dateToISO(new Date(month.getFullYear(), month.getMonth(), index + 1));
      return { key: date, date, day: index + 1 };
    })
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-2 py-2">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-50"
          type="button"
          onClick={() => setMonth((current) => addMonths(current, -1))}
          aria-label="이전 달"
        >
          <ChevronLeft aria-hidden className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-neutral-900">{format(month, "yyyy.MM")}</p>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-50"
          type="button"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          aria-label="다음 달"
        >
          <ChevronRight aria-hidden className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-neutral-200 text-center text-[0.72rem] font-medium text-neutral-400">
        {detailWeekdays.map((day) => (
          <div className="py-2" key={day}>
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 p-2">
        {cells.map((cell) => {
          const log = cell.date ? logs.find((item) => item.wateredDate === cell.date) : undefined;
          return (
            <button
              className="flex aspect-square min-w-0 flex-col items-center justify-center rounded-md text-sm text-neutral-600 hover:bg-neutral-50 disabled:hover:bg-white"
              key={cell.key}
              type="button"
              disabled={!cell.date}
              onClick={() => log && onSelect(log)}
            >
              {cell.day}
              {cell.date ? log ? <span className={`mt-1 h-1.5 w-1.5 rounded-full ${logTypeDotClass[log.logType]}`} /> : <span className="mt-1 h-1.5 w-1.5" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Album({ logs, onSelect }: { logs: WateringLog[]; onSelect: (log: WateringLog) => void }) {
  const photos = logs.flatMap((log) => log.photos.map((photo) => ({ photo, log })));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const selected = selectedIndex === null ? null : photos[selectedIndex];
  const movePhoto = (amount: number) => {
    setSelectedIndex((current) => {
      if (current === null) return current;
      return Math.min(photos.length - 1, Math.max(0, current + amount));
    });
  };
  const handleTouchEnd = (clientX: number, clientY: number) => {
    const start = touchStartRef.current;
    if (!start) return;

    const distanceX = clientX - start.x;
    const distanceY = clientY - start.y;
    if (Math.abs(distanceX) > 48 && Math.abs(distanceX) > Math.abs(distanceY) * 1.4) {
      movePhoto(distanceX < 0 ? 1 : -1);
    }
    touchStartRef.current = null;
  };

  if (photos.length === 0) {
    return <p className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">아직 사진 기록이 없어요.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map(({ photo }, index) => (
          <button className="overflow-hidden rounded-lg" key={photo.id} type="button" onClick={() => setSelectedIndex(index)}>
            <img alt="" className="aspect-square object-cover" src={photo.imageUrl} />
          </button>
        ))}
      </div>
      {selected ? (
        <div
          className="fixed inset-0 z-[80] flex touch-pan-y flex-col bg-neutral-950/90 px-4 py-[max(1rem,env(safe-area-inset-top))] text-white"
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStartRef.current = { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
          }}
          onTouchEnd={(event) => {
            const touch = event.changedTouches[0];
            handleTouchEnd(touch?.clientX ?? 0, touch?.clientY ?? 0);
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" type="button" onClick={() => setSelectedIndex(null)} aria-label="닫기">
              <X aria-hidden className="h-5 w-5" />
            </button>
            <p className="text-sm text-white/70">
              {(selectedIndex ?? 0) + 1} / {photos.length}
            </p>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <img alt="" className="max-h-full max-w-full rounded-lg object-contain" src={selected.photo.imageUrl} />
          </div>
          <div className="mt-4 grid grid-cols-[3rem_1fr_3rem] items-center gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 disabled:opacity-30"
              type="button"
              disabled={selectedIndex === 0}
              onClick={() => movePhoto(-1)}
              aria-label="이전 사진"
            >
              <ChevronLeft aria-hidden className="h-6 w-6" />
            </button>
            <button
              className="h-12 rounded-md bg-white text-sm font-semibold text-neutral-950"
              type="button"
              onClick={() => {
                onSelect(selected.log);
                setSelectedIndex(null);
              }}
            >
              이 기록 보기
            </button>
            <button
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 disabled:opacity-30"
              type="button"
              disabled={selectedIndex === photos.length - 1}
              onClick={() => movePhoto(1)}
              aria-label="다음 사진"
            >
              <ChevronRight aria-hidden className="h-6 w-6" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
