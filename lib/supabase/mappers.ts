import type { Plant, PlantCondition, PlantSnooze, SoilStatus, WaterAmount, WateringLog, WateringLogPhoto } from "@/lib/types";

type PlantRow = {
  id: string;
  user_id: string;
  nickname: string;
  scientific_name: string | null;
  plant_type: string | null;
  watering_interval_days: number;
  started_at: string;
  memo: string | null;
  cover_image_url: string | null;
  created_at: string;
};

type WateringLogRow = {
  id: string;
  user_id: string;
  plant_id: string;
  watered_date: string;
  soil_status: SoilStatus | null;
  water_amount: WaterAmount | null;
  plant_conditions: PlantCondition[] | null;
  memo: string | null;
  created_at: string;
  watering_log_photos?: WateringLogPhotoRow[];
};

type WateringLogPhotoRow = {
  id: string;
  watering_log_id: string;
  image_url: string;
  storage_path: string;
};

type PlantSnoozeRow = {
  id: string;
  plant_id: string;
  snoozed_until: string;
};

export function mapPlant(row: PlantRow): Plant {
  return {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    scientificName: row.scientific_name ?? undefined,
    plantType: row.plant_type ?? undefined,
    wateringIntervalDays: row.watering_interval_days,
    startedAt: row.started_at,
    memo: row.memo ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    createdAt: row.created_at
  };
}

export function mapWateringLog(row: WateringLogRow): WateringLog {
  return {
    id: row.id,
    userId: row.user_id,
    plantId: row.plant_id,
    wateredDate: row.watered_date,
    soilStatus: row.soil_status ?? undefined,
    waterAmount: row.water_amount ?? undefined,
    plantConditions: row.plant_conditions ?? [],
    memo: row.memo ?? undefined,
    photos: (row.watering_log_photos ?? []).map(mapWateringLogPhoto),
    createdAt: row.created_at
  };
}

export function mapWateringLogPhoto(row: WateringLogPhotoRow): WateringLogPhoto {
  return {
    id: row.id,
    wateringLogId: row.watering_log_id,
    imageUrl: row.image_url,
    storagePath: row.storage_path
  };
}

export function mapPlantSnooze(row: PlantSnoozeRow): PlantSnooze {
  return {
    id: row.id,
    plantId: row.plant_id,
    snoozedUntil: row.snoozed_until
  };
}
