import { addDays, compareAsc, endOfMonth, format, isBefore, startOfMonth } from "date-fns";
import { addDaysISO, dateToISO, daysBetween, parseISODate } from "@/lib/date";
import type { DateBucket, Plant, PlantSnooze, WateringLog } from "@/lib/types";

export function getLastWateredDate(plantId: string, logs: WateringLog[]) {
  const plantLogs = logs
    .filter((log) => log.plantId === plantId && log.logType === "watering")
    .sort((a, b) => b.wateredDate.localeCompare(a.wateredDate));

  return plantLogs[0]?.wateredDate;
}

export function getNextWateringDate(plant: Plant, logs: WateringLog[]) {
  const baseDate = getLastWateredDate(plant.id, logs) ?? plant.startedAt ?? plant.createdAt;
  return addDaysISO(baseDate, plant.wateringIntervalDays);
}

export function isSnoozed(plant: Plant, snoozes: PlantSnooze[], today: string) {
  const snooze = snoozes.find((item) => item.plantId === plant.id);
  return snooze ? snooze.snoozedUntil >= today : false;
}

export function getTodayPlants(plants: Plant[], logs: WateringLog[], snoozes: PlantSnooze[], today: string) {
  return plants
    .filter((plant) => getNextWateringDate(plant, logs) <= today)
    .filter((plant) => !isSnoozed(plant, snoozes, today))
    .sort((a, b) => getNextWateringDate(a, logs).localeCompare(getNextWateringDate(b, logs)));
}

export function getUpcomingPlants(plants: Plant[], logs: WateringLog[], today: string) {
  return plants
    .map((plant) => ({ plant, days: daysBetween(today, getNextWateringDate(plant, logs)) }))
    .filter((item) => item.days >= 1 && item.days <= 2)
    .sort((a, b) => a.days - b.days);
}

export function getUncheckedPlants(plants: Plant[], logs: WateringLog[], today: string) {
  return plants
    .map((plant) => ({
      plant,
      daysSince: daysBetween(getLastWateredDate(plant.id, logs) ?? plant.startedAt, today),
      daysOver: daysBetween(getNextWateringDate(plant, logs), today)
    }))
    .filter((item) => item.daysOver >= 3 || !getLastWateredDate(item.plant.id, logs))
    .sort((a, b) => b.daysOver - a.daysOver);
}

export function getPlantLogs(plantId: string, logs: WateringLog[]) {
  return logs.filter((log) => log.plantId === plantId).sort((a, b) => b.wateredDate.localeCompare(a.wateredDate));
}

export function buildMonthBuckets(monthDate: Date, plants: Plant[], logs: WateringLog[], snoozes: PlantSnooze[] = []): DateBucket[] {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const buckets = new Map<string, DateBucket>();

  for (let day = monthStart; compareAsc(day, monthEnd) <= 0; day = addDays(day, 1)) {
    const date = format(day, "yyyy-MM-dd");
    buckets.set(date, { date, actualLogs: [], scheduledPlants: [] });
  }

  for (const log of logs) {
    const bucket = buckets.get(log.wateredDate);
    if (bucket) bucket.actualLogs.push(log);
  }

  for (const plant of plants) {
    const anchor = getLastWateredDate(plant.id, logs) ?? plant.startedAt ?? plant.createdAt;
    const snooze = snoozes.find((item) => item.plantId === plant.id);
    let next = addDays(parseISODate(anchor), plant.wateringIntervalDays);
    if (snooze && dateToISO(next) <= snooze.snoozedUntil) {
      next = parseISODate(snooze.snoozedUntil);
    }
    while (isBefore(next, monthStart)) {
      next = addDays(next, plant.wateringIntervalDays);
    }

    while (compareAsc(next, monthEnd) <= 0) {
      const date = dateToISO(next);
      const bucket = buckets.get(date);
      const hasActualLogForPlant = bucket?.actualLogs.some((log) => log.plantId === plant.id && log.logType === "watering");
      if (bucket && !hasActualLogForPlant) bucket.scheduledPlants.push(plant);
      next = addDays(next, plant.wateringIntervalDays);
    }
  }

  return Array.from(buckets.values());
}

export function getWateringIntervalSuggestion(plant: Plant, logs: WateringLog[]) {
  const dates = Array.from(new Set(getPlantLogs(plant.id, logs).filter((log) => log.logType === "watering").map((log) => log.wateredDate)))
    .sort()
    .slice(-5);

  if (dates.length < 4) return null;

  const gaps = dates.slice(1).map((date, index) => daysBetween(dates[index], date));
  const average = Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length);
  const variance = gaps.reduce((sum, gap) => sum + Math.abs(gap - average), 0) / gaps.length;

  if (Math.abs(plant.wateringIntervalDays - average) < 2 || variance > 2) return null;

  return {
    average,
    current: plant.wateringIntervalDays,
    gaps
  };
}
