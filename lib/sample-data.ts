import type { Plant, PlantSnooze, Profile, WateringLog } from "@/lib/types";

export const profile: Profile = {
  id: "user-demo",
  displayName: "PlantLog",
  notificationTime: "20:00",
  isPublic: false,
  createdAt: "2026-04-01"
};

export const plants: Plant[] = [
  {
    id: "monstera",
    userId: profile.id,
    nickname: "큰 몬스",
    scientificName: "Monstera deliciosa",
    plantType: "몬스테라",
    wateringIntervalDays: 7,
    startedAt: "2026-03-10",
    memo: "거실 창가에서 천천히 새 잎을 내는 중.",
    coverImageUrl: "",
    createdAt: "2026-03-10"
  },
  {
    id: "begonia",
    userId: profile.id,
    nickname: "창가 베고니아",
    scientificName: "Begonia maculata",
    plantType: "베고니아",
    wateringIntervalDays: 5,
    startedAt: "2026-04-02",
    memo: "흙 윗부분이 마르면 확인.",
    coverImageUrl: "",
    createdAt: "2026-04-02"
  },
  {
    id: "hoya",
    userId: profile.id,
    nickname: "호야",
    scientificName: "Hoya carnosa",
    plantType: "호야",
    wateringIntervalDays: 10,
    startedAt: "2026-02-18",
    memo: "조금 건조하게 두는 편.",
    coverImageUrl: "",
    createdAt: "2026-02-18"
  },
  {
    id: "alocasia",
    userId: profile.id,
    nickname: "알로카시아",
    plantType: "알로카시아",
    wateringIntervalDays: 6,
    startedAt: "2026-04-20",
    memo: "잎 처짐을 관찰.",
    coverImageUrl: "",
    createdAt: "2026-04-20"
  },
  {
    id: "parlor-palm",
    userId: profile.id,
    nickname: "테이블야자",
    plantType: "야자",
    wateringIntervalDays: 7,
    startedAt: "2026-01-12",
    memo: "가끔 잎끝이 마름.",
    coverImageUrl: "",
    createdAt: "2026-01-12"
  }
];

export const wateringLogs: WateringLog[] = [
  {
    id: "log-monstera-1",
    userId: profile.id,
    plantId: "monstera",
    wateredDate: "2026-05-14",
    logType: "watering",
    soilStatus: "dry",
    waterAmount: "deep",
    plantConditions: ["healthy", "new_growth"],
    memo: "새 잎이 펴지는 중.",
    photos: [],
    createdAt: "2026-05-14T20:00:00Z"
  },
  {
    id: "log-monstera-2",
    userId: profile.id,
    plantId: "monstera",
    wateredDate: "2026-05-07",
    logType: "watering",
    soilStatus: "dry",
    waterAmount: "normal",
    plantConditions: ["healthy"],
    memo: "",
    photos: [],
    createdAt: "2026-05-07T20:00:00Z"
  },
  {
    id: "log-begonia-1",
    userId: profile.id,
    plantId: "begonia",
    wateredDate: "2026-05-16",
    logType: "watering",
    soilStatus: "moist",
    waterAmount: "little",
    plantConditions: ["healthy"],
    memo: "잎 반점 상태 좋음.",
    photos: [],
    createdAt: "2026-05-16T20:00:00Z"
  },
  {
    id: "log-hoya-1",
    userId: profile.id,
    plantId: "hoya",
    wateredDate: "2026-05-12",
    logType: "watering",
    soilStatus: "dry",
    waterAmount: "normal",
    plantConditions: ["healthy"],
    memo: "",
    photos: [],
    createdAt: "2026-05-12T20:00:00Z"
  },
  {
    id: "log-alocasia-1",
    userId: profile.id,
    plantId: "alocasia",
    wateredDate: "2026-05-17",
    logType: "watering",
    soilStatus: "dry",
    waterAmount: "normal",
    plantConditions: ["drooping"],
    memo: "저녁에 잎이 조금 처져 있어 확인.",
    photos: [],
    createdAt: "2026-05-17T20:00:00Z"
  },
  {
    id: "log-palm-1",
    userId: profile.id,
    plantId: "parlor-palm",
    wateredDate: "2026-05-04",
    logType: "watering",
    soilStatus: "dry",
    waterAmount: "normal",
    plantConditions: ["dry"],
    memo: "잎끝 확인.",
    photos: [],
    createdAt: "2026-05-04T20:00:00Z"
  }
];

export const plantSnoozes: PlantSnooze[] = [];
