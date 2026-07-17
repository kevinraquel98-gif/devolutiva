import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function addDaysISO(iso: string, days: number): string {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}

export function addMonthsISO(iso: string, months: number): string {
  return format(addMonths(parseISO(iso), months), "yyyy-MM-dd");
}

export function daysUntil(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date());
}

export function formatDateBR(iso: string): string {
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

export function formatMonthBR(iso: string): string {
  try {
    return format(parseISO(iso), "MMM/yy", { locale: ptBR });
  } catch {
    return iso;
  }
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function buildClampedDateISO(year: number, monthIndex: number, day: number): string {
  const y = year + Math.floor(monthIndex / 12);
  const m = ((monthIndex % 12) + 12) % 12;
  const clampedDay = Math.min(Math.max(day, 1), lastDayOfMonth(y, m));
  return format(new Date(y, m, clampedDay), "yyyy-MM-dd");
}

/** Data ISO para `day` (1-31) no mesmo mês de `referenceISO`, clampada ao último dia do mês. */
export function dateForDayInMonth(day: number, referenceISO: string): string {
  const ref = parseISO(referenceISO);
  return buildClampedDateISO(ref.getFullYear(), ref.getMonth(), day);
}

/**
 * Resolve `day` (1-31) para a próxima ocorrência a partir de hoje: mês atual se o dia
 * ainda não passou, senão o mês seguinte.
 */
export function resolveDueDateFromDay(day: number, referenceISO: string = todayISO()): string {
  const ref = parseISO(referenceISO);
  const candidate = buildClampedDateISO(ref.getFullYear(), ref.getMonth(), day);
  if (candidate >= referenceISO) return candidate;
  return buildClampedDateISO(ref.getFullYear(), ref.getMonth() + 1, day);
}

/** Data ISO para `day` (1-31) `monthOffset` meses a partir de hoje (0 = mês atual). */
export function dueDateForMonthOffset(day: number, monthOffset: number): string {
  const ref = parseISO(todayISO());
  return buildClampedDateISO(ref.getFullYear(), ref.getMonth() + monthOffset, day);
}

/** Diferença em meses entre duas chaves "yyyy-MM" (toMonth - fromMonth). */
export function monthsBetween(fromMonthKey: string, toMonthKey: string): number {
  const [fy, fm] = fromMonthKey.split("-").map(Number);
  const [ty, tm] = toMonthKey.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}
