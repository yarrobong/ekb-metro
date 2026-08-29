import type { NearestTrain } from "../../../domain/metro";
import { formatRelativeTime } from "../../../domain/time";

interface UpcomingTrainsListProps {
  trains: NearestTrain[];
  showSeconds: boolean;
}

export function UpcomingTrainsList({ trains, showSeconds }: UpcomingTrainsListProps) {
  if (trains.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-2xl bg-surface-raised p-4"
      role="region"
      aria-labelledby="upcoming-trains-title"
    >
      <h3
        id="upcoming-trains-title"
        className="mb-3 px-2 text-sm font-semibold text-text-primary"
      >
        Следующие поезда
      </h3>
      <ul className="space-y-1">
        {trains.map((train) => (
          <li
            key={train.scheduleTime}
            className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-surface-hover"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium text-text-primary tabular-nums">
                {train.displayTime}
              </span>
              {train.isLastTrain && (
                <span className="rounded bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                  последний
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-text-secondary tabular-nums">
              через {formatRelativeTime(train.secondsLeft, showSeconds)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
