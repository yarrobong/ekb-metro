import type { Station } from "../../domain/metro";
import {
  formatApproximateTravelTime,
  formatRouteDescription,
  formatStationCount,
} from "../../domain/metro";

interface RouteProgressCardProps {
  currentStation: Station;
  destinationStation: Station;
  routeStations: Station[];
  stationCount: number;
  travelSeconds: number;
}

type RoutePointKind = "current" | "intermediate" | "destination";

export function RouteProgressCard({
  currentStation,
  destinationStation,
  routeStations,
  stationCount,
  travelSeconds,
}: RouteProgressCardProps) {
  const ariaDescription = formatRouteDescription(
    currentStation,
    destinationStation,
    stationCount,
    travelSeconds,
  );
  const routePoints: Array<{ station: Station; kind: RoutePointKind }> =
    routeStations.map((station, index) => {
      const isCurrent = index === 0;
      const isDestination = index === routeStations.length - 1;

      return {
        station,
        kind: isCurrent ? "current" : isDestination ? "destination" : "intermediate",
      };
    });

  return (
    <section
      className="rounded-2xl border border-border bg-surface-raised p-4"
      aria-labelledby="route-progress-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            id="route-progress-title"
            className="text-sm font-medium text-text-secondary"
          >
            Станция назначения
          </p>
          <p className="mt-2 text-2xl font-bold text-text-primary break-words">
            {destinationStation.name}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold text-text-primary">
            {formatStationCount(stationCount)}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {formatApproximateTravelTime(travelSeconds)}
          </p>
        </div>
      </div>

      <p className="sr-only">{ariaDescription}</p>

      <ol aria-hidden="true" className="mt-5">
        {routePoints.map(({ station, kind }, index) => (
          <li key={station.id} className={index > 0 ? "relative mt-4" : "relative"}>
            {index < routePoints.length - 1 && (
              <span
                className="absolute left-4 top-8 h-[calc(100%+1rem)] w-px bg-border"
                aria-hidden="true"
              />
            )}

            <div className="flex items-start gap-4">
              <div className="relative z-10 flex size-8 shrink-0 items-center justify-center">
                <span className={getPointClassName(kind)} aria-hidden="true" />
              </div>

              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                  {getPointLabel(kind)}
                </p>
                <p className="mt-1 text-base font-semibold leading-6 text-text-primary break-words">
                  {station.name}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function getPointLabel(kind: RoutePointKind): string {
  if (kind === "current") {
    return "Сейчас";
  }

  if (kind === "destination") {
    return "Назначение";
  }

  return "По пути";
}

function getPointClassName(kind: RoutePointKind): string {
  if (kind === "current") {
    return "size-4 rounded-full border-4 border-accent/20 bg-accent shadow-[0_0_0_6px_rgba(16,185,129,0.12)]";
  }

  if (kind === "destination") {
    return "size-4 rounded-full border-2 border-accent bg-surface";
  }

  return "size-3 rounded-full bg-text-disabled/70";
}
