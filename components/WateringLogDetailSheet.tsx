"use client";

import { useState } from "react";
import { Check, Edit3, Trash2, X } from "lucide-react";
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const toggleCondition = (value: PlantCondition) => {
    setPlantConditions((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const save = async () => {
    if (!user) {
      setIsEditing(false);
      return;
    }

    setSaveState("saving");
    await updateWateringLog(log.id, {
      wateredDate,
      soilStatus,
      waterAmount,
      plantConditions,
      memo
    });
    setSaveState("saved");
    setIsEditing(false);
    setShowSavedToast(true);
    window.setTimeout(() => setShowSavedToast(false), 1400);
  };

  const remove = async () => {
    await deleteWateringLog(log.id);
    onClose();
  };

  return (
    <BottomSheet
      hideCloseButton
      onClose={onClose}
      headerLeft={
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          type="button"
          onClick={onClose}
          aria-label="닫기"
        >
          <X aria-hidden className="h-5 w-5" />
        </button>
      }
      headerAction={
        <>
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 ${
              isEditing ? "bg-neutral-100 text-neutral-900" : "text-neutral-500"
            }`}
            type="button"
            onClick={() => (isEditing ? void save() : setIsEditing(true))}
            aria-label={isEditing ? "저장" : "수정"}
          >
            {isEditing ? <Check aria-hidden className="h-4 w-4" /> : <Edit3 aria-hidden className="h-4 w-4" />}
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
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
            {isEditing ? (saveState === "saving" ? "저장 중" : "체크를 누르면 저장됩니다") : saveState === "saved" ? "저장됨" : formatKoreanDate(wateredDate)}
          </p>
        </div>

        {isEditing ? (
          <>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">날짜</span>
              <div className="w-full min-w-0 overflow-hidden rounded-md border border-neutral-200 bg-white focus-within:border-neutral-500">
                <input
                  className="block h-11 w-full min-w-0 appearance-none bg-transparent px-3 text-center text-base text-neutral-900 outline-none"
                  type="date"
                  value={wateredDate}
                  onChange={(event) => setWateredDate(event.target.value)}
                />
              </div>
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
      {deleteConfirmOpen ? (
        <ConfirmOverlay
          title="기록을 삭제할까요?"
          description="삭제한 물주기 기록은 되돌릴 수 없습니다."
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={() => void remove()}
        />
      ) : null}
      {showSavedToast ? (
        <div className="pointer-events-none absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          저장되었습니다
        </div>
      ) : null}
    </BottomSheet>
  );
}

function ConfirmOverlay({
  title,
  description,
  onCancel,
  onConfirm
}: {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 px-5 backdrop-blur-sm">
      <div className="w-full rounded-lg border border-neutral-200 bg-white p-4 shadow-[0_12px_35px_rgba(0,0,0,0.08)]">
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="h-10 rounded-md border border-neutral-200 text-sm font-medium text-neutral-700" type="button" onClick={onCancel}>
            취소
          </button>
          <button className="h-10 rounded-md border border-red-100 bg-white text-sm font-semibold text-red-500" type="button" onClick={onConfirm}>
            삭제
          </button>
        </div>
      </div>
    </div>
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
