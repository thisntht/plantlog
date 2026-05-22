"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save } from "lucide-react";
import { todayISO } from "@/lib/date";
import { usePlantData } from "@/components/AppProviders";
import type { Plant } from "@/lib/types";

export function PlantForm({ onSaved, variant = "page" }: { onSaved?: (plant: Plant | null) => void; variant?: "page" | "sheet" }) {
  const router = useRouter();
  const { addPlant, isDemo, user, uploadPlantCover } = usePlantData();
  const [nickname, setNickname] = useState("");
  const [wateringIntervalDays, setWateringIntervalDays] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [plantType, setPlantType] = useState("");
  const [startedAt, setStartedAt] = useState(todayISO());
  const [memo, setMemo] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!nickname.trim()) {
      setError("표시 이름을 입력해주세요.");
      return;
    }

    if (!wateringIntervalDays.trim()) {
      setError("물주기 주기를 입력해주세요.");
      return;
    }

    const interval = Number(wateringIntervalDays);
    if (!Number.isFinite(interval) || interval <= 0) {
      setError("물주기 주기는 1일 이상으로 입력해주세요.");
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const coverImageUrl = coverFile ? await uploadPlantCover(coverFile) : undefined;
      const plant = await addPlant({
        nickname: nickname.trim(),
        wateringIntervalDays: interval,
        scientificName: scientificName.trim(),
        plantType: plantType.trim(),
        startedAt,
        memo: memo.trim(),
        coverImageUrl
      });
      if (onSaved) {
        onSaved(plant);
        return;
      }
      router.push(plant ? `/plants/${plant.id}` : "/plants");
    } catch (error) {
      const message = getErrorMessage(error);
      setError(`저장하지 못했어요. ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={variant === "sheet" ? "space-y-5" : "space-y-5 rounded-lg border border-neutral-200 bg-white p-4"}>
      <Field label="표시 이름" placeholder="큰 몬스" required value={nickname} onChange={setNickname} />
      <Field label="물주기 주기" placeholder="7" required type="number" suffix="일" value={wateringIntervalDays} onChange={setWateringIntervalDays} />
      <Field label="정식 식물명" placeholder="Monstera deliciosa" value={scientificName} onChange={setScientificName} />
      <Field label="식물 종류" placeholder="몬스테라" value={plantType} onChange={setPlantType} />
      <Field label="시작일" type="date" value={startedAt} onChange={setStartedAt} />
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-neutral-700">메모</span>
        <textarea
          className="min-h-28 w-full resize-none rounded-md border border-neutral-200 p-3 text-base outline-none focus:border-neutral-500"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
        />
      </label>
      {coverPreview ? <img alt="대표 사진 미리보기" className="aspect-[4/3] w-full rounded-lg object-cover" src={coverPreview} /> : null}
      <label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 text-sm font-medium text-neutral-500">
        <Camera aria-hidden className="h-4 w-4" />
        {coverFile ? "대표 사진 변경" : "대표 사진"}
        <input
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setCoverFile(file);
            setCoverPreview(file ? URL.createObjectURL(file) : "");
          }}
        />
      </label>
      {isDemo ? <p className="text-sm leading-6 text-neutral-500">로그인 전에는 저장되지 않습니다. Google 로그인 후 내 식물을 추가할 수 있어요.</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-neutral-900 text-sm font-semibold text-white" type="button" onClick={save} disabled={saving}>
        <Save aria-hidden className="h-4 w-4" />
        {saving ? "저장 중" : "저장"}
      </button>
    </form>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const details = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [details.message, details.details, details.hint, details.code]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());

    if (parts.length > 0) return parts.join(" ");
    return JSON.stringify(error);
  }
  return "알 수 없는 오류";
}

function Field({
  label,
  placeholder,
  required,
  type = "text",
  suffix,
  value,
  onChange
}: {
  label: string;
  placeholder?: string;
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
      <div className="flex items-center rounded-md border border-neutral-200 bg-white px-3 focus-within:border-neutral-500">
        <input
          className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? <span className="text-sm text-neutral-400">{suffix}</span> : null}
      </div>
    </label>
  );
}
