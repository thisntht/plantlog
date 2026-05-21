"use client";

import { useEffect, useState } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { usePlantData } from "@/components/AppProviders";
import { formatKoreanDate } from "@/lib/date";
import type { Plant, PlantCondition, SoilStatus, WaterAmount, WateringLog } from "@/lib/types";

const soilOptions: { value: SoilStatus; label: string }[] = [
  { value: "dry", label: "말랐음" },
  { value: "moist", label: "약간 촉촉" },
  { value: "wet", label: "축축함" }
];

const amountOptions: { value: WaterAmount; label: string }[] = [
  { value: "little", label: "조금" },
  { value: "normal", label: "보통" },
  { value: "deep", label: "듬뿍" }
];

const conditionOptions: { value: PlantCondition; label: string }[] = [
  { value: "healthy", label: "건강함" },
  { value: "new_growth", label: "새순" },
  { value: "drooping", label: "잎 처짐" },
  { value: "yellow_leaf", label: "노란 잎" },
  { value: "dry", label: "건조" }
];

const soilLabels = { dry: "말랐음", moist: "약간 촉촉", wet: "축축함" };
const amountLabels = { little: "조금", normal: "보통", deep: "듬뿍" };
const conditionLabels = {
  healthy: "건강함",
  new_growth: "새순",
  drooping: "잎 처짐",
  yellow_leaf: "노란 잎",
  dry: "건조"
};

export function WateringLogDetailSheet({
  log,
  plant,
  onClose
}: {
  log: WateringLog;
  plant: Plant;
  onClose: () => void;
}) {
  const { updateWateringLog, deleteWateringLog, user } = usePlantData();
  const [wateredDate, setWateredDate] = useState(log.wateredDate);
  const [soilStatus, setSoilStatus] = useState<SoilStatus | undefined>(log.soilStatus);
  const [waterAmount, setWaterAmount] = useState<WaterAmount | undefined>(log.waterAmount);
  const [plantConditions, setPlantConditions] = useState<PlantCondition[]>(log.plantConditions);
  const [memo, setMemo] = useState(log.memo ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!user || !isEditing) return;

    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      await updateWateringLog(log.id, {
        wateredDate,
        soilStatus,
        waterAmount,
        plantConditions,
        memo
      });
      setSaveState("saved");
    }, 450);

    return () => window.clearTimeout(timer);
  }, [isEditing, log.id, memo, plantConditions, soilStatus, updateWateringLog, user, waterAmount, wateredDate]);

  const toggleCondition = (value: PlantCondition) => {
    setPlantConditions((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const remove = async () => {
    await deleteWateringLog(log.id);
    onClose();
  };

  return (
    <BottomSheet
      title={isEditing ? "기록 수정" : undefined}
      onClose={onClose}
      headerLeft={
        <>
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 ${
              isEditing ? "bg-neutral-100 text-neutral-900" : "text-neutral-500"
            }`}
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            aria-label="수정"
          >
            <Edit3 aria-hidden className="h-4 w-4" />
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
            type="button"
            onClick={() => void remove()}
            aria-label="삭제"
          >
            <Trash2 aria-hidden className="h-4 w-4" />
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm font-medium text-neutral-900">{plant.nickname}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {isEditing ? (saveState === "saving" ? "저장 중" : saveState === "saved" ? "저장됨" : "자동 저장") : formatKoreanDate(wateredDate)}
          </p>
        </div>

        {isEditing ? (
          <>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">날짜</span>
              <input
                className="h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-base text-neutral-900 outline-none focus:border-neutral-500"
                type="date"
                value={wateredDate}
                onChange={(event) => setWateredDate(event.target.value)}
              />
            </label>

            <ChoiceGroup title="흙 상태" options={soilOptions} selected={soilStatus} onSelect={setSoilStatus} />
            <ChoiceGroup title="물 준 양" options={amountOptions} selected={waterAmount} onSelect={setWaterAmount} />

            <section>
              <h3 className="mb-2 text-sm font-medium text-neutral-700">식물 상태</h3>
              <div className="flex flex-wrap gap-2">
                {conditionOptions.map((option) => {
                  const active = plantConditions.includes(option.value);
                  return (
                    <button
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        active ? "border-neutral-900 bg-neutral-100 text-neutral-950" : "border-neutral-200 text-neutral-600"
                      }`}
                      key={option.value}
                      type="button"
                      onClick={() => toggleCondition(option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">메모</span>
              <textarea
                className="min-h-28 w-full resize-none rounded-md border border-neutral-200 bg-white p-3 text-base outline-none focus:border-neutral-500"
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
              />
            </label>
          </>
        ) : (
          <>
            <Info label="날짜" value={formatKoreanDate(wateredDate)} />
            <Info label="흙 상태" value={soilStatus ? soilLabels[soilStatus] : "기록 없음"} />
            <Info label="물 준 양" value={waterAmount ? amountLabels[waterAmount] : "기록 없음"} />
            <Info label="식물 상태" value={plantConditions.map((item) => conditionLabels[item]).join(", ") || "기록 없음"} />
            <Info label="메모" value={memo || "기록 없음"} />
          </>
        )}

        {log.photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {log.photos.map((photo) => (
              <img alt="" className="aspect-square rounded-lg object-cover" key={photo.id} src={photo.imageUrl} />
            ))}
          </div>
        ) : null}
      </div>
    </BottomSheet>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-neutral-400">{label}</p>
      <p className="text-sm leading-6 text-neutral-800">{value}</p>
    </div>
  );
}

function ChoiceGroup<T extends string>({
  title,
  options,
  selected,
  onSelect
}: {
  title: string;
  options: { value: T; label: string }[];
  selected?: T;
  onSelect: (value: T) => void;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-medium text-neutral-700">{title}</h3>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            className={`h-10 rounded-md border text-sm transition ${
              selected === option.value ? "border-neutral-900 bg-neutral-100 text-neutral-950" : "border-neutral-200 text-neutral-600"
            }`}
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
