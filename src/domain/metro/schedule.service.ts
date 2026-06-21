import { schedule } from "../../data/schedule";
import { specialDates } from "../../data/specialDates";
import type { MetroTime } from "../time";
import {
  isWeekendMetroDate,
  metroOperationalSecondsToTimestamp,
  shiftMetroDateString,
  timeStringToSeconds,
} from "../time";
import type { DayType, DirectionId, StationId } from "./metro.types";

export type TrainStatus = "waiting" | "approaching" | "arriving" | "error";
export type UpcomingStatus = "ok" | "not_found" | "error";
export type MetroRuntimeStatus = "running" | "before_open" | "after_close" | "error";
export type ServiceDayType = DayType | "special";
export type DayScheduleMode = "today" | "date" | "weekday" | "weekend";
export type DayScheduleStatus = "ok" | "error";

export interface NearestTrain {
  scheduleTime: string;
  displayTime: string;
  totalSeconds: number;
  secondsLeft: number;
  status: TrainStatus;
  isLastTrain: boolean;
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
  dayType: ServiceDayType;
  scheduleDayType: DayType;
  operationalDate: string;
  isPreviousOperationalDay: boolean;
  nearest: NearestTrain | null;
  next: NearestTrain[];
  firstTrain: NearestTrain | null;
  lastTrain: NearestTrain | null;
  secondsUntilFirstTrain: number | null;
  message?: string;
}

export interface DayScheduleTrain {
  sourceTime: string;
  displayTime: string;
  absoluteTimestamp?: number | undefined;
  operationalMinutes: number;
  displayHour: number;
  displayMinute: number;
  isAfterMidnight: boolean;
  isPast: boolean;
  isNext: boolean;
  isCurrent: boolean;
  isLast: boolean;
  secondsFromNow?: number | undefined;
}

export interface DayScheduleHourGroup {
  key: string;
  displayHour: string;
  isAfterMidnight: boolean;
  trains: DayScheduleTrain[];
}

export interface DayScheduleResult {
  stationId: StationId;
  directionId: DirectionId;
  mode: DayScheduleMode;
  status: DayScheduleStatus;
  serviceDate?: string | undefined;
  dayType: ServiceDayType;
  scheduleDayType: DayType;
  trains: DayScheduleTrain[];
  groups: DayScheduleHourGroup[];
  firstTrain: DayScheduleTrain | null;
  lastTrain: DayScheduleTrain | null;
  nextTrain: DayScheduleTrain | null;
  totalCount: number;
  isPreviousOperationalDay: boolean;
  message?: string;
}

interface ResolveMetroStateOptions {
  currentSchedule: string[] | null;
  currentDayType: DayType;
  currentServiceDayType?: ServiceDayType;
  currentDate: string;
  currentTime: MetroTime;
  previousSchedule?: string[] | null;
  previousDayType?: DayType;
  previousServiceDayType?: ServiceDayType;
  previousDate?: string;
  nextSchedule?: string[] | null;
  nextDayType?: DayType;
  nextServiceDayType?: ServiceDayType;
  nextDate?: string;
}

interface ServiceDayContext {
  scheduleDayType: DayType;
  serviceDayType: ServiceDayType;
}

interface DayScheduleBaseTrain {
  sourceTime: string;
  displayTime: string;
  operationalMinutes: number;
  operationalSeconds: number;
  displayHour: number;
  displayMinute: number;
  isAfterMidnight: boolean;
}

interface DayScheduleBaseGroup {
  key: string;
  displayHour: string;
  isAfterMidnight: boolean;
  trainIndices: number[];
}

interface DayScheduleBase {
  stationId: StationId;
  directionId: DirectionId;
  mode: DayScheduleMode;
  serviceDate?: string | undefined;
  dayType: ServiceDayType;
  scheduleDayType: DayType;
  trains: DayScheduleBaseTrain[];
  groups: DayScheduleBaseGroup[];
}

const ARRIVAL_WINDOW_SECONDS = 15;
const APPROACHING_THRESHOLD_SECONDS = 30;
const DAY_SECONDS = 24 * 60 * 60;
const baseScheduleCache = new Map<string, DayScheduleBase>();

export function getDayTypeForDate(dateString: string, isWeekend: boolean): DayType {
  return getServiceDayContextForDate(dateString, isWeekend).scheduleDayType;
}

export function getServiceDayContextForDate(
  dateString: string,
  isWeekend: boolean,
): ServiceDayContext {
  const special = specialDates.find((item) => item.date === dateString);

  if (special) {
    return {
      scheduleDayType: special.type,
      serviceDayType: "special",
    };
  }

  const scheduleDayType = isWeekend ? "weekend" : "weekday";

  return {
    scheduleDayType,
    serviceDayType: scheduleDayType,
  };
}

export function getScheduleFor(
  stationId: StationId,
  directionId: DirectionId,
  dayType: DayType,
): string[] | null {
  const stationSchedule = schedule[stationId];
  if (!stationSchedule) {
    return null;
  }

  const directionSchedule = stationSchedule[directionId];
  if (!directionSchedule) {
    return null;
  }

  const key = dayType === "weekend" ? "weekends" : "weekdays";
  return directionSchedule[key] || null;
}

export function getUpcomingTrains(
  scheduleTimes: string[],
  metroTime: Pick<MetroTime, "totalSeconds">,
): UpcomingTrains {
  if (!scheduleTimes || scheduleTimes.length === 0) {
    return { nearest: null, next: [], status: "error", dayType: "weekday" };
  }

  const nearestIdx = findNextTrainIndex(scheduleTimes, metroTime.totalSeconds);
  if (nearestIdx === -1) {
    return { nearest: null, next: [], status: "not_found", dayType: "weekday" };
  }

  const nearestStatus = getTrainStatus(
    scheduleTimes[nearestIdx]!,
    metroTime.totalSeconds,
  );
  const nearest = buildTrain(
    scheduleTimes,
    nearestIdx,
    metroTime.totalSeconds,
    nearestStatus,
  );
  const next: NearestTrain[] = [];

  for (
    let index = nearestIdx + 1;
    index < nearestIdx + 5 && index < scheduleTimes.length;
    index++
  ) {
    next.push(buildTrain(scheduleTimes, index, metroTime.totalSeconds));
  }

  return { nearest, next, status: "ok", dayType: "weekday" };
}

export function resolveMetroState(
  stationId: StationId,
  directionId: DirectionId,
  metroTime: MetroTime,
): MetroServiceState {
  const currentDate = metroTime.dateString;
  const previousDate = shiftMetroDateString(currentDate, -1);
  const nextDate = shiftMetroDateString(currentDate, 1);

  const currentDayContext = getServiceDayContextForDate(
    currentDate,
    isWeekendMetroDate(currentDate),
  );
  const previousDayContext = getServiceDayContextForDate(
    previousDate,
    isWeekendMetroDate(previousDate),
  );
  const nextDayContext = getServiceDayContextForDate(
    nextDate,
    isWeekendMetroDate(nextDate),
  );

  return resolveMetroStateFromSchedules({
    currentSchedule: getScheduleFor(
      stationId,
      directionId,
      currentDayContext.scheduleDayType,
    ),
    currentDayType: currentDayContext.scheduleDayType,
    currentServiceDayType: currentDayContext.serviceDayType,
    currentDate,
    currentTime: metroTime,
    previousSchedule: getScheduleFor(
      stationId,
      directionId,
      previousDayContext.scheduleDayType,
    ),
    previousDayType: previousDayContext.scheduleDayType,
    previousServiceDayType: previousDayContext.serviceDayType,
    previousDate,
    nextSchedule: getScheduleFor(stationId, directionId, nextDayContext.scheduleDayType),
    nextDayType: nextDayContext.scheduleDayType,
    nextServiceDayType: nextDayContext.serviceDayType,
    nextDate,
  });
}

export function resolveMetroStateFromSchedules(
  options: ResolveMetroStateOptions,
): MetroServiceState {
  const {
    currentSchedule,
    currentDayType,
    currentServiceDayType = currentDayType,
    currentDate,
    currentTime,
    previousSchedule = null,
    previousDayType = currentDayType,
    previousServiceDayType = previousDayType,
    previousDate = shiftMetroDateString(currentDate, -1),
    nextSchedule = null,
    nextDayType = currentDayType,
    nextServiceDayType = nextDayType,
    nextDate = shiftMetroDateString(currentDate, 1),
  } = options;

  if (!currentSchedule || currentSchedule.length === 0) {
    return buildErrorState(
      currentDate,
      currentServiceDayType,
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
        const previousOperationalSeconds = currentTime.totalSeconds + DAY_SECONDS;
        const previousUpcoming = getUpcomingTrains(previousSchedule, {
          totalSeconds: previousOperationalSeconds,
        });

        if (previousUpcoming.status === "ok") {
          return {
            status: "running",
            dayType: previousServiceDayType,
            scheduleDayType: previousDayType,
            operationalDate: previousDate,
            isPreviousOperationalDay: true,
            nearest: previousUpcoming.nearest,
            next: previousUpcoming.next,
            firstTrain: buildTrain(previousSchedule, 0, previousOperationalSeconds),
            lastTrain: buildTrain(
              previousSchedule,
              previousSchedule.length - 1,
              previousOperationalSeconds,
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
      dayType: currentServiceDayType,
      scheduleDayType: currentDayType,
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
      dayType: currentServiceDayType,
      scheduleDayType: currentDayType,
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
      currentServiceDayType,
      currentDayType,
      "Не удалось определить первый поезд следующего дня.",
    );
  }

  const nextFirstSeconds = timeStringToSeconds(nextSchedule[0]!);

  return {
    status: "after_close",
    dayType: nextServiceDayType,
    scheduleDayType: nextDayType,
    operationalDate: nextDate,
    isPreviousOperationalDay: false,
    nearest: null,
    next: [],
    firstTrain: buildTrain(nextSchedule, 0, currentTime.totalSeconds - DAY_SECONDS),
    lastTrain: buildTrain(
      currentSchedule,
      currentSchedule.length - 1,
      currentTime.totalSeconds,
    ),
    secondsUntilFirstTrain: DAY_SECONDS - currentTime.totalSeconds + nextFirstSeconds,
  };
}

export function resolveDaySchedule(
  stationId: StationId,
  directionId: DirectionId,
  metroTime: MetroTime,
  mode: DayScheduleMode,
): DayScheduleResult {
  if (mode === "date") {
    return resolveDayScheduleForDate(stationId, directionId, metroTime.dateString);
  }

  if (mode === "today") {
    const metroState = resolveMetroState(stationId, directionId, metroTime);
    const currentSchedule = getScheduleFor(
      stationId,
      directionId,
      metroState.scheduleDayType,
    );

    if (!currentSchedule || currentSchedule.length === 0) {
      return buildEmptyDayScheduleResult({
        stationId,
        directionId,
        mode,
        dayType: metroState.dayType,
        scheduleDayType: metroState.scheduleDayType,
        serviceDate: metroState.operationalDate,
        isPreviousOperationalDay: metroState.isPreviousOperationalDay,
        message:
          metroState.message ?? "Для этой станции и направления расписание не найдено",
      });
    }

    return materializeDayScheduleResult(
      getOrCreateDayScheduleBase({
        stationId,
        directionId,
        mode,
        serviceDate: metroState.operationalDate,
        dayType: metroState.dayType,
        scheduleDayType: metroState.scheduleDayType,
        scheduleTimes: currentSchedule,
      }),
      getOperationalNowSeconds(metroState, metroTime),
      "ok",
      metroState.isPreviousOperationalDay,
    );
  }

  const scheduleDayType = mode;
  const scheduleTimes = getScheduleFor(stationId, directionId, scheduleDayType);

  if (!scheduleTimes || scheduleTimes.length === 0) {
    return buildEmptyDayScheduleResult({
      stationId,
      directionId,
      mode,
      dayType: scheduleDayType,
      scheduleDayType,
      isPreviousOperationalDay: false,
      message: "Для этой станции и направления расписание не найдено",
    });
  }

  return materializeDayScheduleResult(
    getOrCreateDayScheduleBase({
      stationId,
      directionId,
      mode,
      dayType: scheduleDayType,
      scheduleDayType,
      scheduleTimes,
    }),
    null,
    "ok",
    false,
  );
}

export function resolveDayScheduleForDate(
  stationId: StationId,
  directionId: DirectionId,
  dateString: string,
): DayScheduleResult {
  const serviceDayContext = getServiceDayContextForDate(
    dateString,
    isWeekendMetroDate(dateString),
  );
  const scheduleTimes = getScheduleFor(
    stationId,
    directionId,
    serviceDayContext.scheduleDayType,
  );

  if (!scheduleTimes || scheduleTimes.length === 0) {
    return buildEmptyDayScheduleResult({
      stationId,
      directionId,
      mode: "date",
      dayType: serviceDayContext.serviceDayType,
      scheduleDayType: serviceDayContext.scheduleDayType,
      serviceDate: dateString,
      isPreviousOperationalDay: false,
      message: "Для этой станции и направления расписание не найдено",
    });
  }

  return materializeDayScheduleResult(
    getOrCreateDayScheduleBase({
      stationId,
      directionId,
      mode: "date",
      serviceDate: dateString,
      dayType: serviceDayContext.serviceDayType,
      scheduleDayType: serviceDayContext.scheduleDayType,
      scheduleTimes,
    }),
    null,
    "ok",
    false,
  );
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
    isLastTrain: index === scheduleTimes.length - 1,
    originalIndex: index,
  };
}

function getTrainStatus(scheduleTime: string, currentSeconds: number): TrainStatus {
  const secondsLeft = timeStringToSeconds(scheduleTime) - currentSeconds;

  if (secondsLeft <= 0 && secondsLeft > -ARRIVAL_WINDOW_SECONDS) {
    return "arriving";
  }

  if (secondsLeft > 0 && secondsLeft <= APPROACHING_THRESHOLD_SECONDS) {
    return "approaching";
  }

  return "waiting";
}

function findNextTrainIndex(scheduleTimes: string[], currentSeconds: number): number {
  for (let index = 0; index < scheduleTimes.length; index++) {
    const diff = timeStringToSeconds(scheduleTimes[index]!) - currentSeconds;

    if (diff > -ARRIVAL_WINDOW_SECONDS) {
      return index;
    }
  }

  return -1;
}

function toDisplayTime(timeString: string): string {
  const [hours, minutes] = timeString.split(":");
  return `${String(Number(hours) % 24).padStart(2, "0")}:${minutes!}`;
}

function buildErrorState(
  operationalDate: string,
  dayType: ServiceDayType,
  scheduleDayType: DayType,
  message: string,
): MetroServiceState {
  return {
    status: "error",
    dayType,
    scheduleDayType,
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

function getOperationalNowSeconds(
  metroState: MetroServiceState,
  metroTime: MetroTime,
): number {
  if (metroState.isPreviousOperationalDay) {
    return metroTime.totalSeconds + DAY_SECONDS;
  }

  if (metroState.status === "after_close") {
    return metroTime.totalSeconds - DAY_SECONDS;
  }

  return metroTime.totalSeconds;
}

function getOrCreateDayScheduleBase(params: {
  stationId: StationId;
  directionId: DirectionId;
  mode: DayScheduleMode;
  serviceDate?: string;
  dayType: ServiceDayType;
  scheduleDayType: DayType;
  scheduleTimes: string[];
}): DayScheduleBase {
  const cacheKey = [
    params.stationId,
    params.directionId,
    params.mode,
    params.serviceDate ?? "none",
    params.dayType,
    params.scheduleDayType,
  ].join(":");

  const cached = baseScheduleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const trains: DayScheduleBaseTrain[] = params.scheduleTimes.map((sourceTime) => {
    const operationalSeconds = timeStringToSeconds(sourceTime);
    const operationalMinutes = Math.floor(operationalSeconds / 60);
    const displayHour = Math.floor(operationalSeconds / 3600) % 24;
    const displayMinute = Math.floor((operationalSeconds % 3600) / 60);

    return {
      sourceTime,
      displayTime: toDisplayTime(sourceTime),
      operationalMinutes,
      operationalSeconds,
      displayHour,
      displayMinute,
      isAfterMidnight: operationalSeconds >= DAY_SECONDS,
    };
  });

  const groupMap = new Map<string, DayScheduleBaseGroup>();
  trains.forEach((train, index) => {
    const key = `${train.isAfterMidnight ? "after-midnight" : "day"}-${train.displayHour}`;
    const existingGroup = groupMap.get(key);

    if (existingGroup) {
      existingGroup.trainIndices.push(index);
      return;
    }

    groupMap.set(key, {
      key,
      displayHour: String(train.displayHour).padStart(2, "0"),
      isAfterMidnight: train.isAfterMidnight,
      trainIndices: [index],
    });
  });

  const base: DayScheduleBase = {
    stationId: params.stationId,
    directionId: params.directionId,
    mode: params.mode,
    serviceDate: params.serviceDate,
    dayType: params.dayType,
    scheduleDayType: params.scheduleDayType,
    trains,
    groups: Array.from(groupMap.values()),
  };

  baseScheduleCache.set(cacheKey, base);

  return base;
}

function materializeDayScheduleResult(
  base: DayScheduleBase,
  currentSeconds: number | null,
  status: DayScheduleStatus,
  isPreviousOperationalDay: boolean,
): DayScheduleResult {
  const nextIndex =
    currentSeconds === null
      ? null
      : findNextTrainIndex(
          base.trains.map((train) => train.sourceTime),
          currentSeconds,
        );

  const trains = base.trains.map<DayScheduleTrain>((train, index) => ({
    sourceTime: train.sourceTime,
    displayTime: train.displayTime,
    operationalMinutes: train.operationalMinutes,
    displayHour: train.displayHour,
    displayMinute: train.displayMinute,
    absoluteTimestamp:
      base.serviceDate !== undefined
        ? metroOperationalSecondsToTimestamp(base.serviceDate, train.operationalSeconds)
        : undefined,
    isAfterMidnight: train.isAfterMidnight,
    isPast:
      currentSeconds === null
        ? false
        : nextIndex === -1
          ? true
          : nextIndex === null
            ? false
            : index < nextIndex,
    isNext: nextIndex !== null && nextIndex !== -1 ? index === nextIndex : false,
    isCurrent:
      currentSeconds === null
        ? false
        : nextIndex !== null &&
          nextIndex !== -1 &&
          index === nextIndex &&
          train.operationalSeconds - currentSeconds <= 0 &&
          train.operationalSeconds - currentSeconds > -ARRIVAL_WINDOW_SECONDS,
    isLast: index === base.trains.length - 1,
    secondsFromNow:
      currentSeconds === null ? undefined : train.operationalSeconds - currentSeconds,
  }));

  const groups = base.groups.map<DayScheduleHourGroup>((group) => ({
    key: group.key,
    displayHour: group.displayHour,
    isAfterMidnight: group.isAfterMidnight,
    trains: group.trainIndices.map((index) => trains[index]!),
  }));

  const firstTrain = trains[0] ?? null;
  const lastTrain = trains.at(-1) ?? null;
  const nextTrain =
    nextIndex === null || nextIndex === -1 ? null : (trains[nextIndex] ?? null);

  return {
    stationId: base.stationId,
    directionId: base.directionId,
    mode: base.mode,
    status,
    serviceDate: base.serviceDate,
    dayType: base.dayType,
    scheduleDayType: base.scheduleDayType,
    trains,
    groups,
    firstTrain,
    lastTrain,
    nextTrain,
    totalCount: trains.length,
    isPreviousOperationalDay,
  };
}

function buildEmptyDayScheduleResult(params: {
  stationId: StationId;
  directionId: DirectionId;
  mode: DayScheduleMode;
  dayType: ServiceDayType;
  scheduleDayType: DayType;
  serviceDate?: string;
  isPreviousOperationalDay: boolean;
  message: string;
}): DayScheduleResult {
  return {
    stationId: params.stationId,
    directionId: params.directionId,
    mode: params.mode,
    status: "error",
    serviceDate: params.serviceDate,
    dayType: params.dayType,
    scheduleDayType: params.scheduleDayType,
    trains: [],
    groups: [],
    firstTrain: null,
    lastTrain: null,
    nextTrain: null,
    totalCount: 0,
    isPreviousOperationalDay: params.isPreviousOperationalDay,
    message: params.message,
  };
}
