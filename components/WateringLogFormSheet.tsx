"use client";

import { useState } from "react";
import { Camera, Check } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { usePlantData } from "@/components/AppProviders";
import type { LogType, Plant, PlantCondition, SoilStatus, WaterAmount, WateringLog } from "@/lib/types";

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

const logTypeOptions: { value: LogType; label: string }[] = [
  { value: "watering", label: "물주기" },
  { value: "repotting", label: "분갈이" },
  { value: "fertilizing", label: "비료/영양제" }
];

export function WateringLogFormSheet({
  plants,
  selectedPlantId,
  selectedDate,
  onClose,
  onSaved
}: {
  plants: Plant[];
  selectedPlantId?: string;
  selectedDate: string;
  onClose: () => void;
  onSaved?: (log: WateringLog | null) => void;
}) {
  const [plantId, setPlantId] = useState(selectedPlantId ?? plants[0]?.id ?? "");
  const [date, setDate] = useState(selectedDate);
  const [logType, setLogType] = useState<LogType>("watering");
  const [soil, setSoil] = useState<SoilStatus | undefined>();
  const [amount, setAmount] = useState<WaterAmount | undefined>();
  const [conditions, setConditions] = useState<PlantCondition[]>([]);
  const [memo, setMemo] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const { addWateringLog, isDemo, user } = usePlantData();

  const toggleCondition = (value: PlantCondition) => {
    setConditions((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };
  const addPhotos = (files: FileList | null) => {
    const nextFiles = [...photoFiles, ...Array.from(files ?? [])].slice(0, 5);
    setPhotoFiles(nextFiles);
    setPhotoPreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  };
  const removePhoto = (index: number) => {
    const nextFiles = photoFiles.filter((_, itemIndex) => itemIndex !== index);
    setPhotoFiles(nextFiles);
    setPhotoPreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  };

  const save = async () => {
    if (!plantId || !date) return;
    setError("");

    try {
      if (user) {
        const log = await addWateringLog({
          plantId,
          wateredDate: date,
          logType,
          soilStatus: logType === "watering" ? soil : undefined,
          waterAmount: logType === "watering" ? amount : undefined,
          plantConditions: conditions,
          memo,
          photoFiles
        });
        setSaved(true);
        onSaved?.(log);
      } else {
        setSaved(true);
        onSaved?.(null);
      }

      onClose();
    } catch {
      setError("저장하지 못했어요. 잠시 뒤 다시 시도해주세요.");
    }
  };

  return (
    <BottomSheet title="식물 기록" onClose={onClose}>
      <div className="space-y-5">
        <ChoiceGroup title="기록 종류" options={logTypeOptions} selected={logType} onSelect={setLogType} />

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">식물</span>
          <select
            className="h-12 w-full rounded-md border border-neutral-200 bg-white px-3 text-base text-neutral-900 outline-none focus:border-neutral-500"
            value={plantId}
            onChange={(event) => setPlantId(event.target.value)}
          >
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.nickname}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">날짜</span>
          <div className="date-field flex h-12 w-full min-w-0 max-w-full items-center overflow-hidden rounded-md border border-neutral-200 bg-white focus-within:border-neutral-500">
            <input
              className="h-full w-full min-w-0 bg-transparent px-3 text-center text-base leading-[3rem] text-neutral-900 outline-none"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </label>

        {logType === "watering" ? (
          <>
            <ChoiceGroup title="흙 상태" options={soilOptions} selected={soil} onSelect={setSoil} />
            <ChoiceGroup title="물 준 양" options={amountOptions} selected={amount} onSelect={setAmount} />
          </>
        ) : null}

        <section>
          <h3 className="mb-2 text-sm font-medium text-neutral-700">식물 상태</h3>
          <div className="flex flex-wrap gap-2">
            {conditionOptions.map((option) => {
              const active = conditions.includes(option.value);
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
            className="min-h-24 w-full resize-none rounded-md border border-neutral-200 bg-white p-3 text-base outline-none focus:border-neutral-500"
            placeholder="오늘 관찰한 점을 가볍게 남겨보세요."
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        </label>

        {photoPreviews.length > 0 ? (
          <div className="grid grid-cols-5 gap-2">
            {photoPreviews.map((preview, index) => (
              <button className="relative overflow-hidden rounded-lg" key={preview} type="button" onClick={() => removePhoto(index)} aria-label="사진 제거">
                <img alt="" className="aspect-square object-cover" src={preview} />
                <span className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-xs text-neutral-700">x</span>
              </button>
            ))}
          </div>
        ) : null}
        {photoFiles.length < 5 ? (
          <label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 text-sm font-medium text-neutral-500">
            <Camera aria-hidden className="h-4 w-4" />
            사진 최대 5장
            <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => addPhotos(event.target.files)} />
          </label>
        ) : null}

        {isDemo ? <p className="text-sm leading-6 text-neutral-500">로그인 전에는 화면 확인용으로만 동작합니다. 저장하려면 Google로 로그인해주세요.</p> : null}
        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <button
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-neutral-900 text-sm font-semibold text-white transition hover:bg-neutral-800"
          type="button"
          onClick={save}
        >
          {saved ? <Check aria-hidden className="h-4 w-4" /> : null}
          {saved ? "저장했어요" : "저장"}
        </button>
      </div>
    </BottomSheet>
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
            className={`h-10 rounded-lg border text-sm transition ${
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
