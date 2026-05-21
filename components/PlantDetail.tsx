"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CalendarDays, Droplets, ImageIcon, List, Settings2 } from "lucide-react";
import { usePlantData } from "@/components/AppProviders";
import { PlantAvatar } from "@/components/PlantAvatar";
import { WateringLogDetailSheet } from "@/components/WateringLogDetailSheet";
import { WateringLogFormSheet } from "@/components/WateringLogFormSheet";
import { formatKoreanDate, todayISO } from "@/lib/date";
import { getLastWateredDate, getPlantLogs, getWateringIntervalSuggestion } from "@/lib/watering";
import type { Plant, WateringLog } from "@/lib/types";

type Tab = "list" | "calendar" | "album";

export function PlantDetail({ plant }: { plant: Plant }) {
  const { plants, wateringLogs } = usePlantData();
  const [tab, setTab] = useState<Tab>("list");
  const [selectedLog, setSelectedLog] = useState<WateringLog | null>(null);
  const [adding, setAdding] = useState(false);
  const activePlant = plants.find((item) => item.id === plant.id) ?? plant;
  const logs = getPlantLogs(activePlant.id, wateringLogs);
  const lastWatered = getLastWateredDate(activePlant.id, wateringLogs);
  const suggestion = getWateringIntervalSuggestion(activePlant, wateringLogs);

  return (
    <>
      <section className="mb-5 rounded-lg border border-neutral-200 bg-white p-4">
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
          물주기 기록
        </button>
      </section>

      {suggestion ? (
        <section className="mb-5 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Settings2 aria-hidden className="h-4 w-4" />
            주기 제안
          </div>
          <p className="text-sm leading-6 text-neutral-700">
            최근 기록을 보면 평균 {suggestion.average}일마다 물을 주고 있어요. 현재 설정은 {suggestion.current}일이에요.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="h-10 rounded-md border border-neutral-200 bg-white text-sm font-medium text-neutral-700" type="button">
              그대로 둘게요
            </button>
            <button className="h-10 rounded-md bg-neutral-900 text-sm font-semibold text-white" type="button">
              {suggestion.average}일로 변경
            </button>
          </div>
        </section>
      ) : null}

      <div className="mb-4 grid grid-cols-3 rounded-md border border-neutral-200 bg-white p-1">
        <TabButton active={tab === "list"} icon={<List className="h-4 w-4" />} label="리스트" onClick={() => setTab("list")} />
        <TabButton active={tab === "calendar"} icon={<CalendarDays className="h-4 w-4" />} label="캘린더" onClick={() => setTab("calendar")} />
        <TabButton active={tab === "album"} icon={<ImageIcon className="h-4 w-4" />} label="앨범" onClick={() => setTab("album")} />
      </div>

      {tab === "list" ? <LogList logs={logs} onSelect={setSelectedLog} /> : null}
      {tab === "calendar" ? <PlantMiniCalendar logs={logs} onSelect={setSelectedLog} /> : null}
      {tab === "album" ? <Album logs={logs} onSelect={setSelectedLog} /> : null}

      {selectedLog ? <WateringLogDetailSheet log={selectedLog} plant={activePlant} onClose={() => setSelectedLog(null)} /> : null}
      {adding ? <WateringLogFormSheet plants={plants} selectedPlantId={activePlant.id} selectedDate={todayISO()} onClose={() => setAdding(false)} /> : null}
    </>
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

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className={`flex h-10 items-center justify-center gap-1.5 rounded text-sm font-medium ${active ? "bg-neutral-100 text-neutral-950" : "text-neutral-500"}`}
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function LogList({ logs, onSelect }: { logs: WateringLog[]; onSelect: (log: WateringLog) => void }) {
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <button className="w-full rounded-lg border border-neutral-200 bg-white p-4 text-left" key={log.id} type="button" onClick={() => onSelect(log)}>
          <p className="font-medium text-neutral-900">{formatKoreanDate(log.wateredDate)}</p>
          {log.memo ? <p className="mt-1 truncate text-sm text-neutral-500">{log.memo}</p> : null}
        </button>
      ))}
    </div>
  );
}

function PlantMiniCalendar({ logs, onSelect }: { logs: WateringLog[]; onSelect: (log: WateringLog) => void }) {
  return (
    <div className="grid grid-cols-7 gap-2 rounded-lg border border-neutral-200 bg-white p-4">
      {Array.from({ length: 31 }).map((_, index) => {
        const day = index + 1;
        const log = logs.find((item) => Number(item.wateredDate.slice(-2)) === day);
        return (
          <button className="flex aspect-square flex-col items-center justify-center rounded-md text-sm text-neutral-600 hover:bg-neutral-50" key={day} type="button" onClick={() => log && onSelect(log)}>
            {day}
            {log ? <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-900" /> : <span className="mt-1 h-1.5 w-1.5" />}
          </button>
        );
      })}
    </div>
  );
}

function Album({ logs, onSelect }: { logs: WateringLog[]; onSelect: (log: WateringLog) => void }) {
  const photos = logs.flatMap((log) => log.photos.map((photo) => ({ photo, log })));
  if (photos.length === 0) {
    return <p className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">아직 사진 기록이 없어요.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map(({ photo, log }) => (
        <button className="overflow-hidden rounded-lg" key={photo.id} type="button" onClick={() => onSelect(log)}>
          <img alt="" className="aspect-square object-cover" src={photo.imageUrl} />
        </button>
      ))}
    </div>
  );
}
