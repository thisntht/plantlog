"use client";

import { Edit3, Trash2 } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { formatKoreanDate } from "@/lib/date";
import type { Plant, WateringLog } from "@/lib/types";

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
  return (
    <BottomSheet title="기록 상세" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">{formatKoreanDate(log.wateredDate)}</p>
          <h3 className="mt-1 text-lg font-semibold text-neutral-900">{plant.nickname}</h3>
        </div>
        <Info label="흙 상태" value={log.soilStatus ? soilLabels[log.soilStatus] : "기록 없음"} />
        <Info label="물 준 양" value={log.waterAmount ? amountLabels[log.waterAmount] : "기록 없음"} />
        <Info label="식물 상태" value={log.plantConditions.map((item) => conditionLabels[item]).join(", ") || "기록 없음"} />
        <Info label="메모" value={log.memo || "기록 없음"} />
        {log.photos.length > 0 ? <div className="grid grid-cols-3 gap-2">{log.photos.map((photo) => <img alt="" className="aspect-square rounded-lg object-cover" key={photo.id} src={photo.imageUrl} />)}</div> : null}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button className="flex h-11 items-center justify-center gap-2 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-600" type="button">
            <Edit3 aria-hidden className="h-4 w-4" />
            수정
          </button>
          <button className="flex h-11 items-center justify-center gap-2 rounded-lg border border-red-100 text-sm font-medium text-red-500" type="button">
            <Trash2 aria-hidden className="h-4 w-4" />
            삭제
          </button>
        </div>
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
