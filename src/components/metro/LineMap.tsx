import type { StationId, Station } from "../../domain/metro/metro.types";
import { cn } from "../../lib/cn";

interface LineMapProps {
  stations: Station[];
  selectedStationId: StationId | null;
  onStationSelect: (stationId: StationId) => void;
}

export function LineMap({ stations, selectedStationId, onStationSelect }: LineMapProps) {
  return (
    <div className="relative py-4" role="list" aria-label="Схема станций">
      {/* Сплошная линия фона */}
      <div
        className="absolute left-[29px] top-10 bottom-10 w-1 bg-surface-hover rounded-full"
        aria-hidden="true"
      />

      <div className="flex flex-col relative z-10">
        {stations.map((station, index) => {
          const isSelected = selectedStationId === station.id;
          const isFirst = index === 0;
          const isLast = index === stations.length - 1;

          return (
            <button
              key={station.id}
              role="listitem"
              type="button"
              onClick={() => onStationSelect(station.id)}
              aria-current={isSelected ? "true" : undefined}
              className={cn(
                "focus-ring group relative flex items-center min-h-[56px] w-full text-left px-4 rounded-xl transition duration-200",
                isSelected
                  ? "bg-accent-muted"
                  : "hover:bg-white/[0.03] active:bg-white/[0.05]",
              )}
            >
              {/* Маркер станции */}
              <div
                className={cn(
                  "relative flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
                  isSelected
                    ? "border-accent bg-accent shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                    : "border-surface-raised bg-app-bg group-hover:border-text-secondary",
                )}
                aria-hidden="true"
              >
                {isSelected && <div className="size-2.5 rounded-full bg-white" />}
              </div>

              {/* Название станции */}
              <div className="ml-4 min-w-0 flex-1 py-2">
                <span
                  className={cn(
                    "station-name block text-lg font-medium leading-tight transition-colors duration-200",
                    isSelected
                      ? "text-accent font-bold"
                      : "text-text-primary group-hover:text-white",
                  )}
                >
                  {station.name}
                </span>
                {(isFirst || isLast) && !isSelected && (
                  <span className="text-xs text-text-secondary mt-0.5">Конечная</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
