import { formatRussianDayMonth } from "../../domain/time";
import type { DayScheduleResult, DirectionId } from "../../domain/metro";

export function buildScheduleCardContext(schedule: DayScheduleResult): string {
  if (schedule.isPreviousOperationalDay && schedule.serviceDate) {
    return `Ночная часть расписания за ${formatRussianDayMonth(schedule.serviceDate)}`;
  }

  if (schedule.serviceDate) {
    return `${formatRussianDayMonth(schedule.serviceDate)} · ${getCompactDayTypeLabel(schedule.dayType)}`;
  }

  return getCompactDayTypeLabel(schedule.dayType);
}

export function buildSummaryAriaLabel(schedule: DayScheduleResult): string {
  const firstTrain = schedule.firstTrain;
  const lastTrain = schedule.lastTrain;
  const firstPart = firstTrain
    ? `Первый поезд в ${firstTrain.displayHour} часов ${firstTrain.displayMinute} минут.`
    : "Первый поезд недоступен.";
  const lastPart = lastTrain
    ? `Последний поезд в ${lastTrain.displayHour} часов ${lastTrain.displayMinute} минут${lastTrain.isAfterMidnight ? " после полуночи" : ""}.`
    : "Последний поезд недоступен.";

  return `${firstPart} ${lastPart}`;
}

export function getRuntimeDayTypeLabel(dayType: DayScheduleResult["dayType"]): string {
  if (dayType === "special") {
    return "Особый режим";
  }

  return dayType === "weekend" ? "Выходной день" : "Будний день";
}

export function compareDirectionLayoutOrder(
  leftDirectionId: DirectionId,
  rightDirectionId: DirectionId,
): number {
  return (
    getDirectionLayoutOrder(leftDirectionId) - getDirectionLayoutOrder(rightDirectionId)
  );
}

function getCompactDayTypeLabel(dayType: DayScheduleResult["dayType"]): string {
  if (dayType === "special") {
    return "особый режим";
  }

  return dayType === "weekend" ? "выходной день" : "будний день";
}

function getDirectionLayoutOrder(directionId: DirectionId): number {
  return directionId === "to-prospekt-kosmonavtov" ? 0 : 1;
}
