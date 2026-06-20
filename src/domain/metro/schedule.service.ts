import { schedule } from "../../data/schedule";
import { specialDates } from "../../data/specialDates";
import type { MetroTime } from "../time";
import { timeStringToSeconds } from "../time";
import type { DayType, DirectionId, StationId } from "./metro.types";

export type TrainStatus = "waiting" | "approaching" | "arriving" | "error";
export type UpcomingStatus = "ok" | "not_found" | "error";
export type MetroRuntimeStatus = "running" | "before_open" | "after_close" | "error";

export interface NearestTrain {
  scheduleTime: string;
  displayTime: string;
  totalSeconds: number;
  secondsLeft: number;
  status: TrainStatus;
  isLast: boolean;
  originalIndex: number;
}

export interface UpcomingTrains {
  nearest: NearestTrain | null;
  next: NearestTrain[];
  status: UpcomingStatus;
  dayType: DayType;
}

export interface MetroServiceState {
  status: MetroRuntimeStatus;
  dayType: DayType;
  operationalDate: string;
  isPreviousOperationalDay: boolean;
  nearest: NearestTrain | null;
  next: NearestTrain[];
  firstTrain: NearestTrain | null;
  lastTrain: NearestTrain | null;
  secondsUntilFirstTrain: number | null;
  message?: string;
}

interface ResolveMetroStateOptions {
  currentSchedule: string[] | null;
  currentDayType: DayType;
  currentDate: string;
  currentTime: MetroTime;
  previousSchedule?: string[] | null;
  previousDayType?: DayType;
  previousDate?: string;
  nextSchedule?: string[] | null;
  nextDayType?: DayType;
  nextDate?: string;
}

const ARRIVAL_WINDOW_SECONDS = 15;
const APPROACHING_THRESHOLD_SECONDS = 30;
const DAY_SECONDS = 24 * 60 * 60;

export function getDayTypeForDate(dateString: string, isWeekend: boolean): DayType {
  const special = specialDates.find((d) => d.date === dateString);
  if (special) {
    return special.type;
  }
  return isWeekend ? "weekend" : "weekday";
}

export function getScheduleFor(
  stationId: StationId,
  directionId: DirectionId,
  dayType: DayType,
): string[] | null {
  const stSchedule = schedule[stationId];
  if (!stSchedule) return null;

  const dirSchedule = stSchedule[directionId];
  if (!dirSchedule) return null;

  const key = dayType === "weekend" ? "weekends" : "weekdays";
  return dirSchedule[key] || null;
}

export function getUpcomingTrains(
  scheduleTimes: string[],
  metroTime: Pick<MetroTime, "totalSeconds">,
): UpcomingTrains {
  if (!scheduleTimes || scheduleTimes.length === 0) {
    return { nearest: null, next: [], status: "error", dayType: "weekday" };
  }

  let nearestIdx = -1;
  let status: TrainStatus = "waiting";

  for (let i = 0; i < scheduleTimes.length; i++) {
    const tSec = timeStringToSeconds(scheduleTimes[i]!);
    const diff = tSec - metroTime.totalSeconds;

    if (diff > -ARRIVAL_WINDOW_SECONDS) {
      nearestIdx = i;

      if (diff <= 0 && diff > -ARRIVAL_WINDOW_SECONDS) {
        status = "arriving";
      } else if (diff > 0 && diff <= APPROACHING_THRESHOLD_SECONDS) {
        status = "approaching";
      } else {
        status = "waiting";
      }
      break;
    }
  }

  if (nearestIdx === -1) {
    return { nearest: null, next: [], status: "not_found", dayType: "weekday" };
  }

  const nearest = buildTrain(scheduleTimes, nearestIdx, metroTime.totalSeconds, status);
  const next: NearestTrain[] = [];

  for (let i = nearestIdx + 1; i < nearestIdx + 5 && i < scheduleTimes.length; i++) {
    next.push(buildTrain(scheduleTimes, i, metroTime.totalSeconds));
  }

  return { nearest, next, status: "ok", dayType: "weekday" };
}

export function resolveMetroState(
  stationId: StationId,
  directionId: DirectionId,
  metroTime: MetroTime,
): MetroServiceState {
  const currentDate = metroTime.dateString;
  const previousDate = shiftDateString(currentDate, -1);
  const nextDate = shiftDateString(currentDate, 1);

  const currentDayType = getDayTypeForDate(currentDate, isWeekendDate(currentDate));
  const previousDayType = getDayTypeForDate(previousDate, isWeekendDate(previousDate));
  const nextDayType = getDayTypeForDate(nextDate, isWeekendDate(nextDate));

  return resolveMetroStateFromSchedules({
    currentSchedule: getScheduleFor(stationId, directionId, currentDayType),
    currentDayType,
    currentDate,
    currentTime: metroTime,
    previousSchedule: getScheduleFor(stationId, directionId, previousDayType),
    previousDayType,
    previousDate,
    nextSchedule: getScheduleFor(stationId, directionId, nextDayType),
    nextDayType,
    nextDate,
  });
}

export function resolveMetroStateFromSchedules(
  options: ResolveMetroStateOptions,
): MetroServiceState {
  const {
    currentSchedule,
    currentDayType,
    currentDate,
    currentTime,
    previousSchedule = null,
    previousDayType = currentDayType,
    previousDate = shiftDateString(currentDate, -1),
    nextSchedule = null,
    nextDayType = currentDayType,
    nextDate = shiftDateString(currentDate, 1),
  } = options;

  if (!currentSchedule || currentSchedule.length === 0) {
    return buildErrorState(
      currentDate,
      currentDayType,
      "Расписание для выбранного направления не найдено.",
    );
  }

  const currentFirstSeconds = timeStringToSeconds(currentSchedule[0]!);

  if (previousSchedule && previousSchedule.length > 0) {
    const previousLastSeconds = timeStringToSeconds(
      previousSchedule[previousSchedule.length - 1]!,
    );

    if (previousLastSeconds >= DAY_SECONDS) {
      const transitionEndSeconds =
        previousLastSeconds + ARRIVAL_WINDOW_SECONDS - DAY_SECONDS;

      if (currentTime.totalSeconds <= transitionEndSeconds) {
        const previousUpcoming = getUpcomingTrains(previousSchedule, {
          totalSeconds: currentTime.totalSeconds + DAY_SECONDS,
        });

        if (previousUpcoming.status === "ok") {
          return {
            status: "running",
            dayType: previousDayType,
            operationalDate: previousDate,
            isPreviousOperationalDay: true,
            nearest: previousUpcoming.nearest,
            next: previousUpcoming.next,
            firstTrain: buildTrain(
              previousSchedule,
              0,
              currentTime.totalSeconds + DAY_SECONDS,
            ),
            lastTrain: buildTrain(
              previousSchedule,
              previousSchedule.length - 1,
              currentTime.totalSeconds + DAY_SECONDS,
            ),
            secondsUntilFirstTrain: null,
          };
        }
      }
    }
  }

  if (currentTime.totalSeconds < currentFirstSeconds) {
    return {
      status: "before_open",
      dayType: currentDayType,
      operationalDate: currentDate,
      isPreviousOperationalDay: false,
      nearest: null,
      next: [],
      firstTrain: buildTrain(currentSchedule, 0, currentTime.totalSeconds),
      lastTrain: buildTrain(
        currentSchedule,
        currentSchedule.length - 1,
        currentTime.totalSeconds,
      ),
      secondsUntilFirstTrain: currentFirstSeconds - currentTime.totalSeconds,
    };
  }

  const currentUpcoming = getUpcomingTrains(currentSchedule, currentTime);
  if (currentUpcoming.status === "ok") {
    return {
      status: "running",
      dayType: currentDayType,
      operationalDate: currentDate,
      isPreviousOperationalDay: false,
      nearest: currentUpcoming.nearest,
      next: currentUpcoming.next,
      firstTrain: buildTrain(currentSchedule, 0, currentTime.totalSeconds),
      lastTrain: buildTrain(
        currentSchedule,
        currentSchedule.length - 1,
        currentTime.totalSeconds,
      ),
      secondsUntilFirstTrain: null,
    };
  }

  if (!nextSchedule || nextSchedule.length === 0) {
    return buildErrorState(
      currentDate,
      currentDayType,
      "Не удалось определить первый поезд следующего дня.",
    );
  }

  const nextFirstSeconds = timeStringToSeconds(nextSchedule[0]!);

  return {
    status: "after_close",
    dayType: nextDayType,
    operationalDate: nextDate,
    isPreviousOperationalDay: false,
    nearest: null,
    next: [],
    firstTrain: buildTrain(nextSchedule, 0, -DAY_SECONDS + currentTime.totalSeconds),
    lastTrain: buildTrain(
      currentSchedule,
      currentSchedule.length - 1,
      currentTime.totalSeconds,
    ),
    secondsUntilFirstTrain: DAY_SECONDS - currentTime.totalSeconds + nextFirstSeconds,
  };
}

function buildTrain(
  scheduleTimes: string[],
  index: number,
  nowSeconds: number,
  status: TrainStatus = "waiting",
): NearestTrain {
  const scheduleTime = scheduleTimes[index]!;
  const totalSeconds = timeStringToSeconds(scheduleTime);

  return {
    scheduleTime,
    displayTime: toDisplayTime(scheduleTime),
    totalSeconds,
    secondsLeft: totalSeconds - nowSeconds,
    status,
    isLast: index === scheduleTimes.length - 1,
    originalIndex: index,
  };
}

function toDisplayTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  return `${String(Number(hours) % 24).padStart(2, "0")}:${minutes!}`;
}

function buildErrorState(
  operationalDate: string,
  dayType: DayType,
  message: string,
): MetroServiceState {
  return {
    status: "error",
    dayType,
    operationalDate,
    isPreviousOperationalDay: false,
    nearest: null,
    next: [],
    firstTrain: null,
    lastTrain: null,
    secondsUntilFirstTrain: null,
    message,
  };
}

function shiftDateString(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isWeekendDate(dateString: string): boolean {
  const date = new Date(`${dateString}T00:00:00Z`);
  const dayOfWeek = date.getUTCDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}
