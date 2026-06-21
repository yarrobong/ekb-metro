import { stations } from "../../data/stations";
import { directions } from "../../data/directions";
import type { StationId, DirectionId, Station, Direction } from "./metro.types";

export function getStationById(id: StationId): Station | undefined {
  return stations.find((s) => s.id === id);
}

export function getDirectionById(id: DirectionId): Direction | undefined {
  return directions.find((d) => d.id === id);
}

export function getAvailableDirections(stationId: StationId): DirectionId[] {
  const station = getStationById(stationId);
  return station ? station.availableDirections : [];
}

export function getNextStation(
  stationId: StationId,
  directionId: DirectionId,
): Station | undefined {
  const station = getStationById(stationId);
  const direction = getDirectionById(directionId);

  if (!station || !direction) {
    return undefined;
  }

  // To Botanicheskaya -> indexDelta = 1 (nextStation)
  // To Prospekt Kosmonavtov -> indexDelta = -1 (prevStation)
  if (direction.indexDelta === 1 && station.nextStation) {
    return getStationById(station.nextStation);
  }

  if (direction.indexDelta === -1 && station.prevStation) {
    return getStationById(station.prevStation);
  }

  return undefined;
}

export * from "./metro.types";
export * from "./arrival-planner.service";
export * from "./schedule.service";
export * from "./travel.service";
