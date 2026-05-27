export type SoilStatus = "dry" | "moist" | "wet";
export type WaterAmount = "little" | "normal" | "deep";
export type PlantCondition = "healthy" | "new_growth" | "drooping" | "yellow_leaf" | "dry";
export type LogType = "watering" | "repotting" | "fertilizing";

export type Profile = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  notificationTime: string;
  isPublic: boolean;
  createdAt: string;
};

export type Plant = {
  id: string;
  userId: string;
  nickname: string;
  scientificName?: string;
  plantType?: string;
  wateringIntervalDays: number;
  startedAt: string;
  memo?: string;
  coverImageUrl?: string;
  createdAt: string;
};

export type WateringLog = {
  id: string;
  userId: string;
  plantId: string;
  wateredDate: string;
  logType: LogType;
  soilStatus?: SoilStatus;
  waterAmount?: WaterAmount;
  plantConditions: PlantCondition[];
  memo?: string;
  photos: WateringLogPhoto[];
  createdAt: string;
};

export type WateringLogPhoto = {
  id: string;
  wateringLogId: string;
  imageUrl: string;
  storagePath: string;
};

export type PlantSnooze = {
  id: string;
  plantId: string;
  snoozedUntil: string;
};

export type DateBucket = {
  date: string;
  actualLogs: WateringLog[];
  scheduledPlants: Plant[];
};
