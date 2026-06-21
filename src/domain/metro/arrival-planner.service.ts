import {
  formatMinutes,
  metroDateTimeToTimestamp,
  metroOperationalSecondsToTimestamp,
  shiftMetroDateString,
  timeStringToSeconds,
  timestampToMetroDateString,
  timestampToMetroTimeString,
} from "../time";
import type { DirectionId, StationId } from "./metro.types";
import {
  getScheduleFor,
  getServiceDayContextForDate,
  type ServiceDayType,
} from "./schedule.service";
import { getTravelSummary } from "./travel.service";

const ARRIVAL_WINDOW_SECONDS = 15;

export interface ArrivalPlanRequest {
  originStationId: StationId;
  destinationStationId: StationId;
  directionId: DirectionId;
  desiredArrivalTimestamp: number;
  desiredDateString: string;
  desiredTimeString: string;
  nowTimestamp: number;
}

export interface ArrivalPlanCandidate {
  departureTimestamp: number;
  departureDisplayTime: string;
  departureDateString: string;
  arrivalTimestamp: number;
  arrivalDisplayTime: string;
  arrivalDateString: string;
  travelMinutes: number;
  bufferMinutes: number;
  isAfterMidnight: boolean;
  isLastTrain: boolean;
  sourceTime: string;
  serviceDate: string;
}

export type ArrivalPlanFailureReason =
  | "missing-route"
  | "invalid-date"
  | "invalid-time"
  | "no-schedule"
  | "all-trains-passed"
  | "too-early"
  | "no-train-arrives-in-time";

export interface ArrivalPlanResult {
  status: "success" | "failure";
  request: ArrivalPlanRequest;
  desiredDayType?: ServiceDayType | undefined;
  recommended?: ArrivalPlanCandidate | undefined;
  earlierAlternatives: ArrivalPlanCandidate[];
  firstPossibleArrival?: ArrivalPlanCandidate | undefined;
  nearestFutureArrival?: ArrivalPlanCandidate | undefined;
  lastAvailableArrival?: ArrivalPlanCandidate | undefined;
  failureReason?: ArrivalPlanFailureReason | undefined;
  travelSeconds?: number | undefined;
  stationCount?: number | undefined;
  message?: string | undefined;
}

interface CandidateWithMeta extends ArrivalPlanCandidate {
  isAvailableFromNow: boolean;
}

export function planArrivalByTime(request: ArrivalPlanRequest): ArrivalPlanResult {
  if (!request.desiredDateString) {
    return buildFailure(request, "invalid-date");
  }

  if (!request.desiredTimeString) {
    return buildFailure(request, "invalid-time");
  }

  const travelSummary = getTravelSummary(
    request.originStationId,
    request.destinationStationId,
    request.directionId,
  );

  if (!travelSummary) {
    return buildFailure(request, "missing-route", {
      message: "Не удалось рассчитать поездку",
    });
  }

  const desiredDayContext = getServiceDayContextForDate(
    request.desiredDateString,
    isWeekendDateString(request.desiredDateString),
  );
  const desiredDayStartTimestamp = metroDateTimeToTimestamp(
    request.desiredDateString,
    "00:00",
  );
  const candidateServiceDates = [
    shiftMetroDateString(request.desiredDateString, -1),
    request.desiredDateString,
  ] as const;

  const allCandidates = candidateServiceDates.flatMap((serviceDate) => {
    const serviceDayContext = getServiceDayContextForDate(
      serviceDate,
      isWeekendDateString(serviceDate),
    );
    const scheduleTimes = getScheduleFor(
      request.originStationId,
      request.directionId,
      serviceDayContext.scheduleDayType,
    );

    if (!scheduleTimes || scheduleTimes.length === 0) {
      return [];
    }

    return scheduleTimes.map<CandidateWithMeta>((sourceTime, index) => {
      const operationalSeconds = timeStringToSeconds(sourceTime);
      const departureTimestamp = metroOperationalSecondsToTimestamp(
        serviceDate,
        operationalSeconds,
      );
      const arrivalTimestamp = departureTimestamp + travelSummary.travelSeconds * 1000;
      const bufferMinutes = Math.floor(
        (request.desiredArrivalTimestamp - arrivalTimestamp) / 60000,
      );

      return {
        departureTimestamp,
        departureDisplayTime: timestampToMetroTimeString(departureTimestamp),
        departureDateString: timestampToMetroDateString(departureTimestamp),
        arrivalTimestamp,
        arrivalDisplayTime: timestampToMetroTimeString(arrivalTimestamp),
        arrivalDateString: timestampToMetroDateString(arrivalTimestamp),
        travelMinutes: Math.max(1, Math.ceil(travelSummary.travelSeconds / 60)),
        bufferMinutes,
        isAfterMidnight: operationalSeconds >= 24 * 60 * 60,
        isLastTrain: index === scheduleTimes.length - 1,
        sourceTime,
        serviceDate,
        isAvailableFromNow:
          departureTimestamp >= request.nowTimestamp - ARRIVAL_WINDOW_SECONDS * 1000,
      };
    });
  });

  if (allCandidates.length === 0) {
    return buildFailure(request, "no-schedule", {
      desiredDayType: desiredDayContext.serviceDayType,
      travelSeconds: travelSummary.travelSeconds,
      stationCount: travelSummary.stationCount,
      message: "Для выбранной даты расписание не найдено",
    });
  }

  const relevantCandidates = allCandidates.filter(
    (candidate) =>
      candidate.arrivalTimestamp >= desiredDayStartTimestamp &&
      candidate.arrivalDateString === request.desiredDateString,
  );

  const sortedCandidates = relevantCandidates.sort(
    (left, right) => left.departureTimestamp - right.departureTimestamp,
  );
  const fittingCandidates = sortedCandidates.filter(
    (candidate) => candidate.arrivalTimestamp <= request.desiredArrivalTimestamp,
  );
  const fittingAvailableCandidates = fittingCandidates.filter(
    (candidate) => candidate.isAvailableFromNow,
  );
  const availableCandidates = sortedCandidates.filter(
    (candidate) => candidate.isAvailableFromNow,
  );

  if (fittingAvailableCandidates.length > 0) {
    const recommended = fittingAvailableCandidates.at(-1)!;
    const earlierAlternatives = fittingAvailableCandidates
      .slice(0, -1)
      .slice(-2)
      .reverse()
      .map(stripAvailability);

    return {
      status: "success",
      request,
      desiredDayType: desiredDayContext.serviceDayType,
      recommended: stripAvailability(recommended),
      earlierAlternatives,
      firstPossibleArrival: stripAvailability(availableCandidates[0]!),
      nearestFutureArrival: stripAvailability(
        availableCandidates.find(
          (candidate) =>
            candidate.departureTimestamp >=
            request.nowTimestamp - ARRIVAL_WINDOW_SECONDS * 1000,
        )!,
      ),
      lastAvailableArrival: stripAvailability(availableCandidates.at(-1)!),
      travelSeconds: travelSummary.travelSeconds,
      stationCount: travelSummary.stationCount,
      message:
        recommended.bufferMinutes > 30
          ? `Этот вариант прибывает на ${formatMinutes(recommended.bufferMinutes)} раньше.`
          : undefined,
    };
  }

  if (fittingCandidates.length > 0) {
    return buildFailure(request, "all-trains-passed", {
      desiredDayType: desiredDayContext.serviceDayType,
      travelSeconds: travelSummary.travelSeconds,
      stationCount: travelSummary.stationCount,
      firstPossibleArrival: stripAvailability(fittingCandidates[0]!),
      nearestFutureArrival: availableCandidates[0]
        ? stripAvailability(availableCandidates[0])
        : undefined,
      lastAvailableArrival: availableCandidates.at(-1)
        ? stripAvailability(availableCandidates.at(-1)!)
        : undefined,
    });
  }

  const firstAvailableCandidate = availableCandidates[0];
  if (
    firstAvailableCandidate &&
    firstAvailableCandidate.arrivalTimestamp > request.desiredArrivalTimestamp
  ) {
    return buildFailure(request, "too-early", {
      desiredDayType: desiredDayContext.serviceDayType,
      travelSeconds: travelSummary.travelSeconds,
      stationCount: travelSummary.stationCount,
      firstPossibleArrival: stripAvailability(firstAvailableCandidate),
      lastAvailableArrival: availableCandidates.at(-1)
        ? stripAvailability(availableCandidates.at(-1)!)
        : undefined,
    });
  }

  return buildFailure(request, "no-train-arrives-in-time", {
    desiredDayType: desiredDayContext.serviceDayType,
    travelSeconds: travelSummary.travelSeconds,
    stationCount: travelSummary.stationCount,
    nearestFutureArrival: firstAvailableCandidate
      ? stripAvailability(firstAvailableCandidate)
      : undefined,
    lastAvailableArrival: availableCandidates.at(-1)
      ? stripAvailability(availableCandidates.at(-1)!)
      : undefined,
  });
}

export function buildArrivalPlanRequest(params: {
  originStationId: StationId;
  destinationStationId: StationId;
  directionId: DirectionId;
  desiredDateString: string;
  desiredTimeString: string;
  nowTimestamp: number;
}): ArrivalPlanRequest {
  return {
    originStationId: params.originStationId,
    destinationStationId: params.destinationStationId,
    directionId: params.directionId,
    desiredDateString: params.desiredDateString,
    desiredTimeString: params.desiredTimeString,
    desiredArrivalTimestamp: metroDateTimeToTimestamp(
      params.desiredDateString,
      params.desiredTimeString,
    ),
    nowTimestamp: params.nowTimestamp,
  };
}

function buildFailure(
  request: ArrivalPlanRequest,
  failureReason: ArrivalPlanFailureReason,
  overrides: Omit<
    ArrivalPlanResult,
    "status" | "request" | "failureReason" | "earlierAlternatives"
  > = {},
): ArrivalPlanResult {
  return {
    status: "failure",
    request,
    failureReason,
    earlierAlternatives: [],
    ...overrides,
  };
}

function stripAvailability(candidate: CandidateWithMeta): ArrivalPlanCandidate {
  return {
    departureTimestamp: candidate.departureTimestamp,
    departureDisplayTime: candidate.departureDisplayTime,
    departureDateString: candidate.departureDateString,
    arrivalTimestamp: candidate.arrivalTimestamp,
    arrivalDisplayTime: candidate.arrivalDisplayTime,
    arrivalDateString: candidate.arrivalDateString,
    travelMinutes: candidate.travelMinutes,
    bufferMinutes: candidate.bufferMinutes,
    isAfterMidnight: candidate.isAfterMidnight,
    isLastTrain: candidate.isLastTrain,
    sourceTime: candidate.sourceTime,
    serviceDate: candidate.serviceDate,
  };
}

function isWeekendDateString(dateString: string): boolean {
  const shifted = new Date(`${dateString}T00:00:00Z`);
  const dayOfWeek = shifted.getUTCDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}
