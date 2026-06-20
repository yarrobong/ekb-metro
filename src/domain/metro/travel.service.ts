import { driveTimes } from "../../data/driveTimes";
import { stations } from "../../data/stations";
import { formatMinutes } from "../time/formatting";
import { timeStringToSeconds } from "../time/time.service";
import type { MetroTime } from "../time/time.service";
import type { DriveTime, DirectionId, Station, StationId } from "./metro.types";
import type { MetroServiceState, NearestTrain } from "./schedule.service";

const DAY_SECONDS = 24 * 60 * 60;

export interface DestinationOption {
  station: Station;
  stationCount: number;
  travelSeconds: number;
}

export interface TravelEstimate {
  destination: Station;
  stationCount: number;
  segmentCount: number;
  travelSeconds: number;
  roundedTravelMinutes: number;
  includesApproximateSegments: boolean;
  trainReference: "nearest" | "first_current_day" | "first_next_day";
  trainLabel: string;
  boardingTrain: NearestTrain;
  boardingTimeLabel: string;
  arrivalTimeLabel: string;
  totalSecondsUntilArrival: number;
  roundedTotalMinutesUntilArrival: number;
}

export function getAvailableDestinationStations(
  currentStationId: StationId,
  directionId: DirectionId,
): Station[] {
  const currentStation = getStation(currentStationId);
  if (!currentStation) {
    return [];
  }

  const aheadStations = stations.filter((station) =>
    directionId === "to-botanicheskaya"
      ? station.index > currentStation.index
      : station.index < currentStation.index,
  );

  return aheadStations
    .filter(
      (station) => getPathSegments(currentStationId, station.id, directionId) !== null,
    )
    .sort((left, right) =>
      directionId === "to-botanicheskaya"
        ? left.index - right.index
        : right.index - left.index,
    );
}

export function getDestinationOptions(
  currentStationId: StationId,
  directionId: DirectionId,
): DestinationOption[] {
  return getAvailableDestinationStations(currentStationId, directionId)
    .map((station) => {
      const summary = getTravelSummary(currentStationId, station.id, directionId);
      if (!summary) {
        return null;
      }

      return {
        station,
        stationCount: summary.stationCount,
        travelSeconds: summary.travelSeconds,
      };
    })
    .filter((option): option is DestinationOption => option !== null);
}

export function getTravelSummary(
  currentStationId: StationId,
  destinationStationId: StationId,
  directionId: DirectionId,
): {
  stationCount: number;
  segmentCount: number;
  travelSeconds: number;
  includesApproximateSegments: boolean;
} | null {
  const currentStation = getStation(currentStationId);
  const destinationStation = getStation(destinationStationId);

  if (!currentStation || !destinationStation) {
    return null;
  }

  if (currentStation.id === destinationStation.id) {
    return null;
  }

  if (
    (directionId === "to-botanicheskaya" &&
      destinationStation.index <= currentStation.index) ||
    (directionId === "to-prospekt-kosmonavtov" &&
      destinationStation.index >= currentStation.index)
  ) {
    return null;
  }

  const path = getPathSegments(currentStationId, destinationStationId, directionId);
  if (!path || path.length === 0) {
    return null;
  }

  return {
    stationCount: path.length,
    segmentCount: path.length,
    travelSeconds: path.reduce((sum, segment) => sum + segment.timeSeconds, 0),
    includesApproximateSegments: path.some((segment) => segment.isApproximate),
  };
}

export function buildTravelEstimate(
  currentStationId: StationId,
  destinationStationId: StationId,
  directionId: DirectionId,
  metroState: MetroServiceState,
  currentTime: MetroTime,
): TravelEstimate | null {
  const destination = getStation(destinationStationId);
  const summary = getTravelSummary(currentStationId, destinationStationId, directionId);
  const boarding = getReferenceTrain(metroState);

  if (!destination || !summary || !boarding) {
    return null;
  }

  const boardingSeconds = normalizeTrainSeconds(boarding.scheduleTime);
  const arrivalSeconds = boardingSeconds + summary.travelSeconds;
  const arrivalDate = shiftDateString(
    metroState.operationalDate,
    Math.floor(arrivalSeconds / DAY_SECONDS),
  );
  const arrivalTimeSeconds = arrivalSeconds % DAY_SECONDS;
  const totalSecondsUntilArrival =
    Math.max(0, boarding.secondsLeft) + summary.travelSeconds;

  return {
    destination,
    stationCount: summary.stationCount,
    segmentCount: summary.segmentCount,
    travelSeconds: summary.travelSeconds,
    roundedTravelMinutes: roundTravelMinutes(summary.travelSeconds),
    includesApproximateSegments: summary.includesApproximateSegments,
    trainReference:
      metroState.status === "before_open"
        ? "first_current_day"
        : metroState.status === "after_close"
          ? "first_next_day"
          : "nearest",
    trainLabel: getTrainReferenceLabel(metroState),
    boardingTrain: boarding,
    boardingTimeLabel: boarding.displayTime,
    arrivalTimeLabel: formatArrivalTimeLabel(
      currentTime.dateString,
      arrivalDate,
      arrivalTimeSeconds,
    ),
    totalSecondsUntilArrival,
    roundedTotalMinutesUntilArrival: roundTravelMinutes(totalSecondsUntilArrival),
  };
}

export function formatStationCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 14) {
    return `${count} станций`;
  }

  if (mod10 === 1) {
    return `${count} станция`;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} станции`;
  }

  return `${count} станций`;
}

export function formatApproximateTravelTime(seconds: number): string {
  return `Примерно ${formatMinutes(roundTravelMinutes(seconds))} в пути`;
}

function getPathSegments(
  currentStationId: StationId,
  destinationStationId: StationId,
  directionId: DirectionId,
): DriveTime[] | null {
  const currentStation = getStation(currentStationId);
  const destinationStation = getStation(destinationStationId);

  if (!currentStation || !destinationStation) {
    return null;
  }

  const orderedStations =
    directionId === "to-botanicheskaya" ? stations : [...stations].reverse();
  const startIndex = orderedStations.findIndex(
    (station) => station.id === currentStationId,
  );
  const endIndex = orderedStations.findIndex(
    (station) => station.id === destinationStationId,
  );

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  const segments: DriveTime[] = [];
  for (let index = startIndex; index < endIndex; index++) {
    const from = orderedStations[index];
    const to = orderedStations[index + 1];

    if (!from || !to) {
      return null;
    }

    const segment = driveTimes.find(
      (item) =>
        item.from === from.id && item.to === to.id && item.directionId === directionId,
    );

    if (!segment) {
      return null;
    }

    segments.push(segment);
  }

  return segments;
}

function getStation(stationId: StationId) {
  return stations.find((station) => station.id === stationId);
}

function getReferenceTrain(metroState: MetroServiceState): NearestTrain | null {
  if (metroState.status === "running") {
    return metroState.nearest;
  }

  if (metroState.status === "before_open" || metroState.status === "after_close") {
    return metroState.firstTrain;
  }

  return null;
}

function getTrainReferenceLabel(metroState: MetroServiceState): string {
  if (metroState.status === "before_open") {
    return "Первый поезд";
  }

  if (metroState.status === "after_close") {
    return "Первый поезд завтра";
  }

  return "Ближайший поезд";
}

function roundTravelMinutes(seconds: number): number {
  return Math.max(1, Math.ceil(seconds / 60));
}

function normalizeTrainSeconds(scheduleTime: string): number {
  return timeStringToSeconds(scheduleTime);
}

function formatArrivalTimeLabel(
  currentDate: string,
  arrivalDate: string,
  arrivalTimeSeconds: number,
): string {
  const timeLabel = formatClockTime(arrivalTimeSeconds);

  if (arrivalDate === currentDate) {
    return timeLabel;
  }

  if (arrivalDate === shiftDateString(currentDate, 1)) {
    return `завтра в ${timeLabel}`;
  }

  return `${formatDateRussian(arrivalDate)} в ${timeLabel}`;
}

function formatClockTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function shiftDateString(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateRussian(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(date);
}
