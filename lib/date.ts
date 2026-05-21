import { addDays, differenceInCalendarDays, format, isSameDay, parseISO, startOfDay } from "date-fns";

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

export function dateToISO(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function parseISODate(value: string) {
  return startOfDay(parseISO(value));
}

export function addDaysISO(value: string, amount: number) {
  return dateToISO(addDays(parseISODate(value), amount));
}

export function daysBetween(from: string, to: string) {
  return differenceInCalendarDays(parseISODate(to), parseISODate(from));
}

export function isSameISODate(a: string, b: string) {
  return isSameDay(parseISODate(a), parseISODate(b));
}

export function formatKoreanDate(value: string) {
  return format(parseISODate(value), "yyyy.MM.dd");
}
